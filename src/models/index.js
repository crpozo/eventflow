// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { PaymentLog, EventAttendee, Form, Landing, Attendee, Event, Career, Area, Campus } = initSchema(schema);

export {
  PaymentLog,
  EventAttendee,
  Form,
  Landing,
  Attendee,
  Event,
  Career,
  Area,
  Campus
};