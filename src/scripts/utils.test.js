import {
  readStoredEvent,
  tzLabel,
  tzCityLabel,
  eventLocalToISO,
  formatDateHour,
  formatHour,
  formatDate,
  formatSpanishDate,
  validateForm,
  debounce,
} from './utils';

// Fecha fija para todas las pruebas de formato: 2026-04-29 15:00 UTC
// = miércoles 29/04/2026 10:00 en Guayaquil (GMT-5) y 09:00 en Galápagos (GMT-6).
const FECHA_FIJA = '2026-04-29T15:00:00Z';

describe('readStoredEvent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('devuelve null cuando no hay nada guardado', () => {
    expect(readStoredEvent()).toBeNull();
  });

  it('devuelve null cuando se guardó el string literal "undefined" (JSON.stringify(undefined))', () => {
    localStorage.setItem('EVENTFLOW.event', 'undefined');
    expect(readStoredEvent()).toBeNull();
  });

  it('devuelve null cuando el valor guardado es un string vacío', () => {
    localStorage.setItem('EVENTFLOW.event', '');
    expect(readStoredEvent()).toBeNull();
  });

  it('devuelve null (sin lanzar) y loguea cuando el JSON guardado está corrupto', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('EVENTFLOW.event', '{esto no es json');
    expect(readStoredEvent()).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      'readStoredEvent: evento almacenado inválido',
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });

  it('parsea y devuelve el evento cuando el JSON es válido', () => {
    const evento = { id: 'evt-1', name: 'Congreso USFQ', tz: 'Pacific/Galapagos' };
    localStorage.setItem('EVENTFLOW.event', JSON.stringify(evento));
    expect(readStoredEvent()).toEqual(evento);
  });
});

describe('tzLabel', () => {
  it('devuelve GMT-6 para Galápagos', () => {
    expect(tzLabel('Pacific/Galapagos')).toBe('GMT-6');
  });

  it('devuelve GMT-5 para Ecuador continental', () => {
    expect(tzLabel('America/Guayaquil')).toBe('GMT-5');
  });

  it('devuelve GMT-5 por defecto cuando no se pasa zona', () => {
    expect(tzLabel(undefined)).toBe('GMT-5');
  });
});

describe('tzCityLabel', () => {
  it('devuelve la etiqueta de Galápagos para Pacific/Galapagos', () => {
    expect(tzCityLabel('Pacific/Galapagos')).toBe('Galápagos · GMT-6');
  });

  it('devuelve la etiqueta de Quito para cualquier otra zona', () => {
    expect(tzCityLabel('America/Guayaquil')).toBe('Quito · GMT-5');
    expect(tzCityLabel(undefined)).toBe('Quito · GMT-5');
  });
});

describe('eventLocalToISO', () => {
  it('convierte una hora local de Guayaquil (GMT-5) a ISO UTC', () => {
    expect(eventLocalToISO('2026-07-06T08:30', 'America/Guayaquil')).toBe(
      '2026-07-06T13:30:00.000Z'
    );
  });

  it('convierte una hora local de Galápagos (GMT-6) a ISO UTC', () => {
    expect(eventLocalToISO('2026-07-06T08:30', 'Pacific/Galapagos')).toBe(
      '2026-07-06T14:30:00.000Z'
    );
  });

  it('recorta los segundos extra del valor antes de convertir', () => {
    // slice(0, 16) descarta ":45" y usa 08:30 en punto.
    expect(eventLocalToISO('2026-07-06T08:30:45', 'America/Guayaquil')).toBe(
      '2026-07-06T13:30:00.000Z'
    );
  });

  it('usa GMT-5 por defecto cuando la zona es desconocida o falta', () => {
    expect(eventLocalToISO('2026-07-06T08:30', undefined)).toBe(
      '2026-07-06T13:30:00.000Z'
    );
  });

  it('devuelve "" para valores vacíos', () => {
    expect(eventLocalToISO('', 'America/Guayaquil')).toBe('');
    expect(eventLocalToISO(undefined, 'America/Guayaquil')).toBe('');
    expect(eventLocalToISO(null, 'Pacific/Galapagos')).toBe('');
  });
});

describe('formatDate', () => {
  it('formatea un ISO válido como dd/mm/aaaa en UTC', () => {
    expect(formatDate('2026-04-29T15:00:00Z')).toBe('29/04/2026');
  });

  it('acepta objetos Date además de strings', () => {
    expect(formatDate(new Date(Date.UTC(2026, 11, 5)))).toBe('05/12/2026');
  });

  it('devuelve null para un string que no es fecha', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(formatDate('no-es-fecha')).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith('formatDate: Invalid date input');
    errorSpy.mockRestore();
  });

  it('usa la fecha actual cuando no recibe argumento', () => {
    expect(formatDate()).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('rellena con cero el día y el mes en el borde de año UTC', () => {
    expect(formatDate('2026-01-01T00:00:00Z')).toBe('01/01/2026');
  });

  it('devuelve null cuando la entrada revienta al construir la fecha (rama catch)', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const explosivo = {
      valueOf() {
        throw new Error('boom');
      },
    };
    expect(formatDate(explosivo)).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('formatDateHour', () => {
  it('en español muestra el día de la semana y la hora de pared de Guayaquil', () => {
    const resultado = formatDateHour(FECHA_FIJA, 'ES', 'America/Guayaquil');
    expect(resultado).toMatch(/miércoles/);
    expect(resultado).toMatch(/29\/04\/2026/);
    expect(resultado).toMatch(/10:00/); // 15:00 UTC = 10:00 GMT-5
  });

  it('en inglés usa el locale en-US manteniendo la zona del evento', () => {
    const resultado = formatDateHour(FECHA_FIJA, 'EN', 'America/Guayaquil');
    expect(resultado).toMatch(/Wednesday/);
    expect(resultado).toMatch(/04\/29\/2026/);
    expect(resultado).toMatch(/10:00/);
  });

  it('en Galápagos la hora de pared se corre una hora atrás (GMT-6)', () => {
    const resultado = formatDateHour(FECHA_FIJA, 'ES', 'Pacific/Galapagos');
    expect(resultado).toMatch(/09:00/);
  });

  it('sin zona explícita usa Guayaquil por defecto', () => {
    expect(formatDateHour(FECHA_FIJA, 'ES')).toMatch(/10:00/);
  });

  it('con lang desconocido cae al español', () => {
    expect(formatDateHour(FECHA_FIJA, undefined)).toMatch(/miércoles/);
  });

  it('devuelve "" para entradas vacías o fechas inválidas', () => {
    expect(formatDateHour(undefined)).toBe('');
    expect(formatDateHour('')).toBe('');
    expect(formatDateHour('no-es-fecha', 'ES')).toBe('');
  });

  it('devuelve "" cuando la zona horaria es inválida (rama catch)', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(formatDateHour(FECHA_FIJA, 'ES', 'Zona/Inexistente')).toBe('');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('formatHour', () => {
  it('devuelve solo la hora, sin fecha ni año', () => {
    const resultado = formatHour(FECHA_FIJA, 'ES', 'America/Guayaquil');
    expect(resultado).toMatch(/10:00/);
    expect(resultado).not.toMatch(/2026/);
    expect(resultado).not.toMatch(/miércoles/);
  });

  it('respeta la zona de Galápagos', () => {
    expect(formatHour(FECHA_FIJA, 'ES', 'Pacific/Galapagos')).toMatch(/09:00/);
  });

  it('en inglés formatea con AM/PM de en-US', () => {
    expect(formatHour(FECHA_FIJA, 'EN', 'America/Guayaquil')).toMatch(/10:00/);
    expect(formatHour(FECHA_FIJA, 'EN', 'America/Guayaquil')).toMatch(/AM/);
  });

  it('devuelve "" para entradas vacías o fechas inválidas', () => {
    expect(formatHour(undefined)).toBe('');
    expect(formatHour('no-es-fecha')).toBe('');
  });

  it('devuelve "" cuando la zona horaria es inválida (rama catch)', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(formatHour(FECHA_FIJA, 'ES', 'Zona/Inexistente')).toBe('');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('formatSpanishDate', () => {
  it('en español usa el mes largo y la hora de Guayaquil', () => {
    const resultado = formatSpanishDate(FECHA_FIJA, 'ES', 'America/Guayaquil');
    expect(resultado).toMatch(/miércoles/);
    expect(resultado).toMatch(/abril/);
    expect(resultado).toMatch(/2026/);
    expect(resultado).toMatch(/10:00/);
  });

  it('pese al nombre, respeta el idioma de la página cuando es EN', () => {
    const resultado = formatSpanishDate(FECHA_FIJA, 'EN', 'America/Guayaquil');
    expect(resultado).toMatch(/Wednesday/);
    expect(resultado).toMatch(/April/);
    expect(resultado).toMatch(/10:00/);
  });

  it('en Galápagos muestra 09:00 para el mismo instante', () => {
    expect(formatSpanishDate(FECHA_FIJA, 'ES', 'Pacific/Galapagos')).toMatch(/09:00/);
  });

  it('devuelve "" para entradas vacías o fechas inválidas', () => {
    expect(formatSpanishDate(undefined)).toBe('');
    expect(formatSpanishDate('no-es-fecha')).toBe('');
  });

  it('devuelve "" cuando la zona horaria es inválida (rama catch)', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(formatSpanishDate(FECHA_FIJA, 'ES', 'Zona/Inexistente')).toBe('');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('validateForm', () => {
  // jsdom no implementa scrollIntoView; el formulario lo invoca al fallar.
  const scrollIntoViewMock = jest.fn();

  beforeAll(() => {
    Element.prototype.scrollIntoView = scrollIntoViewMock;
  });

  beforeEach(() => {
    scrollIntoViewMock.mockClear();
    document.body.innerHTML = '';
  });

  const montarFormulario = ({ nombre = '', tipo = 'cedula', identificacion = '' } = {}) => {
    document.body.innerHTML = `
      <div id="fb-editor">
        <div class="rendered-form">
          <input type="text" id="nombre" required />
          <select id="tipo_identificacion" required>
            <option value="cedula">Cédula</option>
            <option value="pasaporte">Pasaporte</option>
            <option value="ruc">RUC</option>
          </select>
          <input type="text" id="identificacion" required />
        </div>
      </div>
    `;
    document.querySelector('#nombre').value = nombre;
    document.querySelector('#tipo_identificacion').value = tipo;
    document.querySelector('#identificacion').value = identificacion;
  };

  it('devuelve true y no inserta errores cuando todo está completo', () => {
    montarFormulario({ nombre: 'Carlos', tipo: 'cedula', identificacion: '1712345678' });
    expect(validateForm('ES')).toBe(true);
    expect(document.querySelectorAll('.error-message')).toHaveLength(0);
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it('devuelve false e inserta el mensaje en español junto al campo vacío', () => {
    montarFormulario({ nombre: '', tipo: 'cedula', identificacion: '1712345678' });
    expect(validateForm('ES')).toBe(false);
    const campoNombre = document.querySelector('#nombre');
    const error = campoNombre.nextElementSibling;
    expect(error).toHaveClass('error-message');
    expect(error).toHaveTextContent('El campo no se ha rellenado correctamente');
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('sin argumento el idioma por defecto es español', () => {
    montarFormulario({ nombre: '', tipo: 'cedula', identificacion: '1712345678' });
    expect(validateForm()).toBe(false);
    expect(document.querySelector('.error-message')).toHaveTextContent(
      'El campo no se ha rellenado correctamente'
    );
  });

  it('en inglés inserta el mensaje traducido', () => {
    montarFormulario({ nombre: '', tipo: 'cedula', identificacion: '1712345678' });
    expect(validateForm('EN')).toBe(false);
    expect(document.querySelector('.error-message')).toHaveTextContent(
      'This field was not filled out correctly'
    );
  });

  it('marca un error por cada campo requerido vacío', () => {
    montarFormulario({ nombre: '', tipo: 'cedula', identificacion: '' });
    expect(validateForm('ES')).toBe(false);
    expect(document.querySelectorAll('.error-message')).toHaveLength(2);
  });

  it('con RUC que no tiene 13 dígitos inserta el mensaje de 13 dígitos', () => {
    montarFormulario({ nombre: 'Carlos', tipo: 'ruc', identificacion: '12345' });
    // Ojo: el RUC corto no vuelve isValid=false (comportamiento actual),
    // pero sí deja el mensaje visible junto al campo.
    expect(validateForm('ES')).toBe(true);
    const error = document.querySelector('#identificacion').nextElementSibling;
    expect(error).toHaveClass('error-message');
    expect(error).toHaveTextContent('El campo requiere de 13 digitos númericos');
  });

  it('el mensaje del RUC también se traduce al inglés', () => {
    montarFormulario({ nombre: 'Carlos', tipo: 'ruc', identificacion: 'abc' });
    validateForm('EN');
    expect(document.querySelector('.error-message')).toHaveTextContent(
      'This field requires 13 numeric digits'
    );
  });

  it('con RUC de exactamente 13 dígitos no inserta errores', () => {
    montarFormulario({ nombre: 'Carlos', tipo: 'ruc', identificacion: '1712345678001' });
    expect(validateForm('ES')).toBe(true);
    expect(document.querySelectorAll('.error-message')).toHaveLength(0);
  });

  it('con pasaporte no valida el formato de la identificación', () => {
    montarFormulario({ nombre: 'Carlos', tipo: 'pasaporte', identificacion: 'AB-123' });
    expect(validateForm('ES')).toBe(true);
    expect(document.querySelectorAll('.error-message')).toHaveLength(0);
  });

  it('con cédula no aplica la regla de 13 dígitos', () => {
    montarFormulario({ nombre: 'Carlos', tipo: 'cedula', identificacion: '99' });
    expect(validateForm('ES')).toBe(true);
    expect(document.querySelectorAll('.error-message')).toHaveLength(0);
  });

  it('lanza si el formulario #fb-editor .rendered-form no está en el DOM', () => {
    document.body.innerHTML = '<div id="otro"></div>';
    expect(() => validateForm('ES')).toThrow();
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('agrupa llamadas rápidas y ejecuta una sola vez con los últimos argumentos', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 400);

    debounced('primera');
    debounced('segunda');
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(400);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('segunda');
  });

  it('conserva el this del objeto desde el que se invoca', () => {
    const registro = jest.fn();
    const obj = {
      valor: 'contexto-obj',
      metodo: debounce(function () {
        registro(this.valor);
      }, 100),
    };

    obj.metodo();
    jest.advanceTimersByTime(100);
    expect(registro).toHaveBeenCalledWith('contexto-obj');
  });

  it('reinicia la espera si se vuelve a llamar antes de cumplirse el plazo', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced();
    jest.advanceTimersByTime(200);
    debounced();
    jest.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
