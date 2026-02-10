export default function MapControls({
  checkboxId = 'checkbox',
  selectId = 'shape-select',
  createId = 'crear',
  clearId = 'limpiar',
  label = 'Activar dibujo'
}) {
  return (
    <div id="controls">
      <label className="control-item">
        <input type="checkbox" id={checkboxId} />
        {label}
      </label>
      <select id={selectId} className="control-item" aria-label="Selecciona figura">
        <option value="">Selecciona figura</option>
        <option value="polygon">Poligono</option>
        <option value="circle">Circulo</option>
      </select>
      <button id={createId} className="control-item" type="button">
        Crear
      </button>
      <button id={clearId} className="control-item" type="button">
        Limpiar
      </button>
    </div>
  );
}
