// Sustituye a `aws-amplify/api` en el bundle liviano de la landing: las
// lecturas y altas públicas usan la API key de AppSync, así que basta un
// fetch. Evita cargar Amplify (core + api-graphql) en la carga inicial.
import config from "../../amplifyconfiguration.json";

export function generateClient() {
  return {
    async graphql({ query, variables }) {
      const res = await fetch(config.aws_appsync_graphqlEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": config.aws_appsync_apiKey,
        },
        body: JSON.stringify({ query, variables }),
      });
      const json = await res.json();
      // Igual que el cliente de Amplify: con errores GraphQL la promesa se
      // rechaza con la respuesta completa ({ data, errors }).
      if (!res.ok || json.errors?.length) throw json;
      return json;
    },
  };
}
