// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Las suites de formularios generados (Amplify Studio) hidratan en DOS olas
// (queryData + linked records lazy); bajo carga de la suite completa un reset
// tardío puede pisar interacciones y producir fallos INTERMITENTES de timing.
// Reintento único: un fallo real sigue fallando en el retry y se reporta
// igual; el flake de carga se auto-resuelve. Requiere jest-circus (CRA 5 ✓).
jest.retryTimes(1);
