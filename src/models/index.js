// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Area, Campus } = initSchema(schema);

export {
  Area,
  Campus
};