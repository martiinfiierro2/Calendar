import { useEffect, useMemo, useState } from 'react';
import { TIPOS_COMIDA } from '../../config/appConfig';
import { fetchRecipes } from '../../services/recipeService';
import { syncAutomaticShopping } from '../../services/shoppingService';
import { readStorage, writeStorage } from '../../services/storageService';
import { fechaClave, fechaDesdeClave } from '../../utils/dateUtils';
import Icon from '../../shared/Icon';
import DayView from './views/DayView';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import YearView from './views/YearView';
import { QuickMealForm, RecipeMealForm } from './MealForms';

const MEALS_KEY = 'calendar_comidas';

function createDemoMeals(recipes) {
  const date = fechaClave(new Date());
  const hours = ['08:00', '11:00', '14:00', '17:00', '21:00'];

  return recipes.slice(0, 5).map((recipe, index) => ({
    id: `demo-${recipe.id}`,
    recetaId: recipe.id,
    fecha: date,
    hora: hours[index],
    nombre: recipe.nombre,
    tipo: TIPOS_COMIDA[Math.min(index, TIPOS_COMIDA.length - 1)].valor,
    icono: TIPOS_COMIDA[Math.min(index, TIPOS_COMIDA.length - 1)].icono,
    modo: 'receta'
  }));
}

export default function CalendarPage() {
  const today = new Date();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('dia');
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedHour, setSelectedHour] = useState('14:00');
  const [form, setForm] = useState(null);
  const [meals, setMeals] = useState(() => {
    const stored = readStorage(MEALS_KEY, null);
    return Array.isArray(stored) ? stored : [];
  });
  const [mealsReady, setMealsReady] = useState(() => Array.isArray(readStorage(MEALS_KEY, null)));
  const [editingMeal, setEditingMeal] = useState(null);

  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`),
    []
  );

  // Las comidas de ejemplo usan los IDs reales de las recetas guardadas en la API.
  useEffect(() => {
    if (mealsReady) return undefined;

    let active = true;
    fetchRecipes()
      .then(recipes => {
        if (!active) return;
        const demo = createDemoMeals(recipes);
        setMeals(demo);
        writeStorage(MEALS_KEY, demo);
      })
      .catch(() => {
        if (active) writeStorage(MEALS_KEY, []);
      })
      .finally(() => {
        if (active) setMealsReady(true);
      });

    return () => {
      active = false;
    };
  }, [mealsReady]);

  // Guarda el calendario y actualiza la compra si el usuario activó esa opción.
  useEffect(() => {
    if (!mealsReady) return;
    writeStorage(MEALS_KEY, meals);
    syncAutomaticShopping();
  }, [meals, mealsReady]);

  const syncDate = newDate => {
    setDate(newDate);
    setVisibleYear(newDate.getFullYear());
    setVisibleMonth(newDate.getMonth());
  };

  const goYear = year => {
    setVisibleYear(year);
    setView('anyo');
  };

  const goMonth = (year, month) => {
    setVisibleYear(year);
    setVisibleMonth(month);
    setView('mes');
  };

  const goDay = newDate => {
    syncDate(newDate);
    setView('dia');
  };

  const goWeek = (newDate = date) => {
    syncDate(newDate);
    setView('semana');
  };

  const changeDay = amount => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + amount);
    goDay(newDate);
  };

  const changeWeek = amount => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + amount * 7);
    goWeek(newDate);
  };

  const changeMonth = amount => {
    const newDate = new Date(visibleYear, visibleMonth + amount, 1);
    goMonth(newDate.getFullYear(), newDate.getMonth());
  };

  const changeDetailView = nextView => {
    if (nextView === 'semana') goWeek(date);
    else goDay(date);
  };

  const openAddMenu = (hour = '14:00', targetDate = date) => {
    syncDate(targetDate);
    setSelectedHour(hour);
    setShowAddMenu(true);
  };

  const openForm = type => {
    setShowAddMenu(false);
    setForm({ type, hour: selectedHour });
  };

  const saveMeal = data => {
    const meal = {
      id: editingMeal?.id || `${Date.now()}`,
      recetaId: data.recetaId,
      fecha: data.fecha,
      hora: data.hora,
      nombre: data.nombre,
      tipo: data.tipo,
      icono: data.icono,
      ingredientes: data.ingredientes,
      modo: data.modo
    };

    setMeals(current => editingMeal
      ? current.map(item => item.id === editingMeal.id ? meal : item)
      : [...current, meal]
    );
    setForm(null);
    setEditingMeal(null);
  };

  const editMeal = meal => {
    setDate(fechaDesdeClave(meal.fecha));
    setEditingMeal(meal);
    setForm({ type: meal.modo, hour: meal.hora, meal });
  };

  const deleteMeal = id => {
    if (!window.confirm('¿Quieres eliminar esta comida?')) return;
    setMeals(current => current.filter(meal => meal.id !== id));
    setEditingMeal(null);
    setForm(null);
  };

  const closeForm = () => {
    const wasEditing = Boolean(editingMeal);
    setForm(null);
    setEditingMeal(null);
    setShowAddMenu(!wasEditing);
  };

  const dayMeals = meals.filter(meal => meal.fecha === fechaClave(date));

  return (
    <div className="contenedor-calendario">
      {view === 'anyo' && (
        <YearView
          year={visibleYear}
          meals={meals}
          onSelectMonth={month => goMonth(visibleYear, month)}
          onChangeYear={amount => goYear(visibleYear + amount)}
          onAdd={() => openAddMenu()}
        />
      )}

      {view === 'mes' && (
        <MonthView
          year={visibleYear}
          month={visibleMonth}
          meals={meals}
          onSelectDay={goDay}
          onBackYear={() => goYear(visibleYear)}
          onChangeMonth={changeMonth}
          onAdd={() => openAddMenu()}
        />
      )}

      {view === 'dia' && (
        <DayView
          date={date}
          hours={hours}
          meals={dayMeals}
          onBackMonth={() => goMonth(date.getFullYear(), date.getMonth())}
          onChangeDay={changeDay}
          onAdd={openAddMenu}
          onEdit={editMeal}
          onDelete={deleteMeal}
          onChangeView={changeDetailView}
        />
      )}

      {view === 'semana' && (
        <WeekView
          date={date}
          meals={meals}
          onBackMonth={() => goMonth(date.getFullYear(), date.getMonth())}
          onChangeWeek={changeWeek}
          onChangeView={changeDetailView}
          onSelectDay={goDay}
          onAdd={openAddMenu}
          onEdit={editMeal}
          onDelete={deleteMeal}
        />
      )}

      {showAddMenu && (
        <>
          <div className="menu-anadir-overlay" onClick={() => setShowAddMenu(false)} />
          <div className="menu-anadir">
            <div className="menu-anadir-indicador" />
            <button className="menu-anadir-opcion" onClick={() => openForm('receta')}>
              <span className="menu-anadir-icono"><Icon name="book" size={19} /></span>
              <span><strong>Receta</strong><small>Elegir una receta guardada</small></span>
            </button>
            <button className="menu-anadir-opcion" onClick={() => openForm('rapida')}>
              <span className="menu-anadir-icono"><Icon name="bolt" size={19} /></span>
              <span><strong>Comida rápida</strong><small>Crear una entrada manual</small></span>
            </button>
            <button className="menu-anadir-cancelar" onClick={() => setShowAddMenu(false)}>Cancelar</button>
          </div>
        </>
      )}

      {form?.type === 'receta' && (
        <RecipeMealForm
          date={date}
          initialHour={form.hour}
          initialMeal={form.meal}
          onClose={closeForm}
          onSave={saveMeal}
        />
      )}

      {form?.type === 'rapida' && (
        <QuickMealForm
          date={date}
          initialHour={form.hour}
          initialMeal={form.meal}
          onClose={closeForm}
          onSave={saveMeal}
        />
      )}
    </div>
  );
}
