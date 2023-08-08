// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { EventAttende, Form, Landing, Attendee, Event, Career, Area, Campus } = initSchema(schema);

export {
  EventAttende,
  Form,
  Landing,
  Attendee,
  Event,
  Career,
  Area,
  Campus
};