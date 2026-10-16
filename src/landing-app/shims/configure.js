// Configura Amplify (una sola vez) al evaluarse este módulo. Los shims lo
// importan PRIMERO, así queda configurado antes de que se evalúen Storage,
// Auth o Predictions, que es cuando se necesitan (PDF del ticket, landing
// desactivada, traducción). Se usa el Amplify de `aws-amplify` (no el de core)
// porque además conecta los proveedores de credenciales de Cognito.
import { Amplify } from "aws-amplify";
import config from "../../amplifyconfiguration.json";

Amplify.configure(config);
