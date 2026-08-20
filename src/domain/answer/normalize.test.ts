import { describe, expect, it } from 'vitest';
import { isCorrectAnswer, normalizeAnswer } from './normalize';

describe('normalizeAnswer', () => {
  it('recorta espacios, pasa a minúsculas y quita tildes', () => {
    expect(normalizeAnswer('  Café  ')).toBe(normalizeAnswer('cafe'));
    expect(normalizeAnswer('  Café  ')).toBe('cafe');
  });

  it('quita puntuación', () => {
    expect(normalizeAnswer('¡La Torre!')).toBe('la torre');
  });

  it('colapsa espacios múltiples en uno', () => {
    expect(normalizeAnswer('la    torre   del   reloj')).toBe('la torre del reloj');
  });

  it('cadena vacía o solo puntuación normaliza a cadena vacía', () => {
    expect(normalizeAnswer('¡¡¡!!!')).toBe('');
    expect(normalizeAnswer('   ')).toBe('');
  });
});

describe('normalizeAnswer — decisión pendiente sobre ñ/ç (PLAN.md §5.2, §13.1)', () => {
  // NFD + strip de diacríticos convierte "ñ" en "n". Se marca como
  // comportamiento activo por defecto; si el producto decide lo contrario,
  // hay que centinelizar "ñ"/"ç" antes de normalizar y activar el test .skip
  // de abajo en su lugar.
  it('"año" normaliza igual que "ano" (comportamiento activo)', () => {
    expect(normalizeAnswer('año')).toBe(normalizeAnswer('ano'));
  });

  it.skip('"año" NO normaliza igual que "ano" (alternativa, si se decide preservar la ñ)', () => {
    expect(normalizeAnswer('año')).not.toBe(normalizeAnswer('ano'));
  });
});

describe('isCorrectAnswer', () => {
  it('la comparación es igualdad exacta: "oro" no valida "oropel"', () => {
    expect(isCorrectAnswer('oropel', ['oro'])).toBe(false);
  });

  it('un acceptedAnswers con varias variantes valida cualquiera de ellas', () => {
    const accepted = ['la torre', 'torre', 'torre del reloj'];
    expect(isCorrectAnswer('Torre', accepted)).toBe(true);
    expect(isCorrectAnswer('¡LA TORRE!', accepted)).toBe(true);
    expect(isCorrectAnswer('la campana', accepted)).toBe(false);
  });

  it('una respuesta vacía nunca valida, ni contra una lista vacía', () => {
    expect(isCorrectAnswer('', [])).toBe(false);
    expect(isCorrectAnswer('   ', [''])).toBe(false);
  });
});
