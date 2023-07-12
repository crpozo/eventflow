// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Form, Landing, Attendee, Event, Career, Area, Campus } = initSchema(schema);

export {
  Form,
  Landing,
  Attendee,
  Event,
  Career,
  Area,
  Campus
};