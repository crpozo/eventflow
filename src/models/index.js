// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { EventAttendee, Form, Landing, Attendee, Event, Career, Area, Campus } = initSchema(schema);

export {
  EventAttendee,
  Form,
  Landing,
  Attendee,
  Event,
  Career,
  Area,
  Campus
};