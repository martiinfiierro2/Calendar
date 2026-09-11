export const defaultRecipes = [
  ['Lasaña bolognesa','Pasta',55,4,'Media',true,['12 placas de lasaña','500 g de carne picada','Tomate triturado','Bechamel','Queso rallado'],['Preparar la salsa de carne y tomate.','Montar capas de pasta, salsa y bechamel.','Cubrir con queso y hornear hasta gratinar.']],
  ['Pollo al curry','Carne',35,3,'Fácil',false,['500 g de pollo','Leche de coco','Curry','Cebolla','Arroz basmati'],['Dorar el pollo.','Pochar la cebolla y añadir el curry.','Añadir leche de coco y cocinar 15 minutos.','Servir con arroz.']],
  ['Gazpacho andaluz','Vegetal',15,4,'Fácil',true,['Tomate maduro','Pepino','Pimiento verde','Aceite de oliva','Vinagre'],['Trocear las verduras.','Triturar con aceite, vinagre y sal.','Enfriar antes de servir.']],
  ['Paella valenciana','Arroz',60,4,'Media',false,['Arroz','Pollo','Conejo','Judía verde','Garrofón','Azafrán'],['Sofreír la carne y las verduras.','Añadir agua y cocinar el caldo.','Incorporar el arroz y cocinar sin remover.']],
  ['Tortilla de patatas','Huevos',35,4,'Fácil',true,['5 huevos','600 g de patatas','Cebolla','Aceite de oliva','Sal'],['Pochar las patatas y la cebolla.','Mezclar con los huevos batidos.','Cuajar por ambos lados.']],
  ['Salmón a la plancha','Pescado',20,2,'Fácil',false,['2 lomos de salmón','Limón','Aceite de oliva','Pimienta','Sal'],['Secar y salpimentar el salmón.','Cocinar a la plancha por ambos lados.','Terminar con limón.']],
  ['Croquetas de jamón','Entrante',50,4,'Media',false,['Jamón serrano','Leche','Harina','Mantequilla','Huevo','Pan rallado'],['Preparar una bechamel espesa con el jamón.','Enfriar la masa.','Formar, empanar y freír.']],
  ['Lentejas estofadas','Legumbres',50,4,'Fácil',false,['Lentejas','Zanahoria','Cebolla','Pimiento','Pimentón'],['Sofreír las verduras.','Añadir lentejas y agua.','Cocinar a fuego suave hasta que estén tiernas.']]
].map(([nombre,categoria,tiempo,raciones,dificultad,favorito,ingredientes,pasos]) => ({
  nombre, categoria, tiempo, raciones, dificultad, favorito, ingredientes, pasos
}));
