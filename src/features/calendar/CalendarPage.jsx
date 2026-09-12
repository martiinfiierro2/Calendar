import { useEffect, useMemo, useState } from 'react';
import { TIPOS_COMIDA } from '../../config/appConfig';
import { actualizarComida, crearComida, eliminarComida, obtenerComidas } from '../../services/mealService';
import { fetchRecipes } from '../../services/recipeService';
import { syncAutomaticShopping } from '../../services/shoppingService';
import { readStorage, removeStorage } from '../../services/storageService';
import { fechaClave, fechaDesdeClave } from '../../utils/dateUtils';
import Icon from '../../shared/Icon';
import DayView from './views/DayView';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import YearView from './views/YearView';
import { QuickMealForm, RecipeMealForm } from './MealForms';

const MEALS_KEY = 'calendar_comidas';

function prepararComida(data) {
  return {
    recetaId: data.recetaId || null,
    fecha: data.fecha,
    hora: data.hora,
    nombre: data.nombre,
    tipo: data.tipo,
    icono: data.icono,
    ingredientes: data.ingredientes || null,
    modo: data.modo
  };
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
  const [meals, setMeals] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [savingMeal, setSavingMeal] = useState(false);
  const [error, setError] = useState('');
  const [editingMeal, setEditingMeal] = useState(null);

  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`),
    []
  );

  // Recupera las comidas del servidor y migra una sola vez las que quedaban en localStorage.
  useEffect(() => {
    let active = true;

    async function cargarComidas() {
      try {
        setError('');
        const remotas = await obtenerComidas();

        if (!active) return;
        if (remotas.length) {
          setMeals(remotas);
          removeStorage(MEALS_KEY);
          return;
        }

        const locales = readStorage(MEALS_KEY, null);
        if (!Array.isArray(locales) || !locales.length) {
          setMeals([]);
          return;
        }

        const recetas = await fetchRecipes();
        const migradas = await Promise.all(locales.map(comida => {
          let recetaId = comida.recetaId || null;

          if (comida.modo === 'receta') {
            const receta = recetas.find(item => item.nombre === comida.nombre)
              || recetas.find(item => String(item.id) === String(comida.recetaId));
            recetaId = receta?.id || null;
          }

          return crearComida(prepararComida({ ...comida, recetaId }));
        }));

        if (!active) return;
        setMeals(migradas);
        removeStorage(MEALS_KEY);
      } catch (err) {
        if (active) setError(err.message || 'No se pudo cargar el calendario.');
      } finally {
        if (active) setLoadingMeals(false);
      }
    }

    cargarComidas();

    return () => {
      active = false;
    };
  }, []);

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

  const saveMeal = async data => {
    if (savingMeal) return;

    try {
      setSavingMeal(true);
      setError('');
      const payload = prepararComida(data);
      const saved = editingMeal
        ? await actualizarComida(editingMeal.id, payload)
        : await crearComida(payload);

      setMeals(current => editingMeal
        ? current.map(item => item.id === editingMeal.id ? saved : item)
        : [...current, saved]
      );
      setForm(null);
      setEditingMeal(null);
      syncAutomaticShopping();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la comida.');
    } finally {
      setSavingMeal(false);
    }
  };

  const editMeal = meal => {
    setDate(fechaDesdeClave(meal.fecha));
    setEditingMeal(meal);
    setForm({ type: meal.modo, hour: meal.hora, meal });
  };

  const deleteMeal = async id => {
    if (!window.confirm('¿Quieres eliminar esta comida?')) return;

    const previous = meals;
    setMeals(current => current.filter(meal => meal.id !== id));
    setEditingMeal(null);
    setForm(null);

    try {
      setError('');
      await eliminarComida(id);
      syncAutomaticShopping();
    } catch (err) {
      setMeals(previous);
      setError(err.message || 'No se pudo eliminar la comida.');
    }
  };

  const closeForm = () => {
    if (savingMeal) return;
    const wasEditing = Boolean(editingMeal);
    setForm(null);
    setEditingMeal(null);
    setShowAddMenu(!wasEditing);
  };

  const dayMeals = meals.filter(meal => meal.fecha === fechaClave(date));

  if (loadingMeals) {
    return (
      <div className="contenedor-calendario">
        <div style={{ padding: '24px', textAlign: 'center' }}>Cargando calendario...</div>
      </div>
    );
  }

  return (
    <div className="contenedor-calendario">
      {error && (
        <div style={{ padding: '8px 14px', fontSize: '13px', textAlign: 'center' }}>{error}</div>
      )}

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
