import React, { Component, createRef, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import { Form } from "models"
import { EditableSection, useCanEditSection } from "components/sectionEdit";
import { PageHeader, Card } from "components/adminUi";
import { readStoredEvent } from "scripts/utils";
import $ from "jquery";
window.jQuery = $;
window.$ = $;
require('jquery-ui-sortable');
require('formBuilder');

// FormBuilder — module-level so its identity is STABLE across the parent's
// re-renders. jQuery formBuilder owns the #fb-editor DOM, so React must never
// re-render or re-mount it once initialised: shouldComponentUpdate returns
// false, and the parent keys it by form id (`form?.id || 'new'`) so later
// DataStore echoes don't remount it. It's initialised ONCE in componentDidMount
// with the formData handed in via props, and reports edits through the onSave
// prop (which the parent wires to a fresh-state ref — no stale closures).
class FormBuilder extends Component {
  fb = createRef();

  shouldComponentUpdate() {
    // jQuery owns this subtree; React must not touch it after mount.
    return false;
  }

  componentDidMount() {
    const { formData, onSave } = this.props;
    $(this.fb.current).formBuilder({
      formData,
      onSave: () => {
        const json = $(this.fb.current).formBuilder('getData', 'json');
        onSave(json);
      },
      i18n: {
        override: {
          'en-US': {
            save: 'Guardar',
            header: 'Titulo',
            dateField: 'Campo Fecha',
            number: 'Campo Número',
            paragraph: "Descripción",
            select: "Campo Seleccionar",
            text: "Campo texto",
            textArea: "Área texto",
          }
        }
      },
      typeUserAttrs: {
        select: {
          className: {
            label: 'Chart',
            options: {
              'pie-chart form-control': 'Pie',
              'bar-chart form-control': 'Bar',
              'no-chart form-control': 'No chart',
            }
          }
        }
      },
      disableFields: ['autocomplete', 'button', 'hidden', 'radio-group', 'file', 'checkbox-group'],
      defaultFields: [
        {
          "type": "select",
          "required": true,
          "label": "Tipo de identificación",
          "name": "tipo_identificacion",
          "access": false,
          "multiple": false,
          "className": "no-chart form-control",
          "values": [
            {
              "label": "Cédula",
              "value": "cedula",
              "selected": true
            },
            {
              "label": "Pasaporte",
              "value": "pasaporte",
              "selected": false
            },
            {
              "label": "RUC",
              "value": "ruc",
              "selected": false
            },
          ]
        },
        {
          "type": "text",
          "required": true,
          "label": "N° de Identificación",
          "className": "form-control",
          "name": "identificacion",
          "access": false,
          "subtype": "text"
        },
        {
          "type": "text",
          "required": false,
          "label": "Código Banner",
          "placeholder": "00216367",
          "className": "form-control",
          "name": "codigo_banner",
          "access": false,
          "subtype": "text"
        },
        {
          "type": "text",
          "required": true,
          "label": "Email",
          "className": "form-control",
          "access": false,
          "name": "email",
          "subtype": "email",
          "placeholder": "promero@yanbal.com",
        },
        {
          "type": "text",
          "required": true,
          "label": "Nombre y apellido",
          "placeholder": "Paula Romero",
          "className": "form-control",
          "name": "nombres",
          "access": false,
          "subtype": "text"
        },
        {
          "type": "text",
          "required": true,
          "label": "Dirección",
          "className": "form-control",
          "name": "direccion",
          "access": false,
          "subtype": "text"
        },
        {
          "type": "text",
          "required": true,
          "label": "Teléfono",
          "placeholder": "+593 99 5653 987",
          "className": "form-control",
          "name": "telefono",
          "access": false,
          "subtype": "text"
        }
      ],
      persistDefaultFields: true
    });
  }

  render() {
    return <div id="fb-editor" ref={this.fb} />;
  }
}

const Dashboard = () => {

  const [form, setForm] = React.useState();
  const [formData, setFormData] = React.useState([]);
  const [formExist, setFormExist] = React.useState(false);
  // Start true: hold the spinner until the FIRST DataStore emission resolves
  // (whether a Form exists or not), so the builder mounts ONCE with the right
  // formData instead of flashing empty -> real.
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();
  const storedEvent = readStoredEvent();
  const eventId = storedEvent?.id;
  const canEdit = useCanEditSection("formulario");

  // Hydrate formData from the store AT MOST ONCE. Later emissions (the echo of
  // our own save) must not re-set formData and remount the jQuery builder.
  const hydratedRef = useRef(false);

  React.useEffect(() => {

    if (!eventId) {
      navigate(`/admin`);
      return
    }

    const sub = DataStore.observeQuery(Form, (f) =>
      f.formEventId.eq(eventId)
    ).subscribe(({ items, isSynced }) => {
      if (items.length > 0) {
        // Always keep the freshest record for copyOf() in updateForm…
        setForm(items[0]);
        setFormExist(true);
        // …but hydrate the builder's formData only on the first emission.
        if (!hydratedRef.current) {
          hydratedRef.current = true;
          setFormData(items[0].questions);
        }
        // Drop the spinner and mount the builder with the real formData.
        setLoading(false);
      } else if (isSynced) {
        // No form AFTER sync: render the builder with defaultFields
        // (formData stays []). Never conclude "no form" from the pre-sync
        // empty snapshot — an existing remote Form may not be in the local
        // store yet, and unlocking here would let Guardar fork a duplicate.
        setFormExist(false);
        setLoading(false);
      }
    });

    return () => {
      sub.unsubscribe();
    };

  }, [eventId, navigate]);

  async function createForm(formData) {
    if (!canEdit) return;
    await DataStore.save(
      new Form({
        "formEventId": eventId,
        "questions": formData,
      })
    );
    alert("Form creado con éxito");
  }

  async function updateForm(form, formData) {
    if (!canEdit) return;
    await DataStore.save(
      Form.copyOf(form, updated => {
        updated.questions = formData;
      })
    );
    alert("Form actualizado con éxito");
  }

  // Fresh-state save handler. The module-level FormBuilder captures onSave once
  // at mount, so we route it through a ref that we overwrite every render — the
  // "Guardar" button always saves against the CURRENT form/formExist, never a
  // stale closure. Keeps the exact save shape: parse formBuilder's JSON and
  // create (if no Form yet) or update (Form.copyOf) with canEdit gating.
  // Guards a create/update in flight so two rapid Guardar clicks (formBuilder's
  // button is never disabled) can't both enter the create path and fork a
  // duplicate Form.
  const savingRef = useRef(false);
  const saveRef = useRef();
  saveRef.current = async (json) => {
    if (!canEdit || !json) return;
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const parsed = JSON.parse(json);
      if (formExist) {
        await updateForm(form, parsed);
      } else {
        // `formExist`/`form` can lag right after the first create (the
        // observeQuery echo that flips them is a separate async emission), and
        // the pre-sync snapshot can read empty. Re-check the store before
        // creating so we never fork a second Form for the same event.
        const existing = await DataStore.query(Form, (f) =>
          f.formEventId.eq(eventId)
        );
        if (existing.length > 0) {
          await updateForm(existing[0], parsed);
        } else {
          await createForm(parsed);
        }
      }
    } finally {
      savingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
        <span className="loader"></span>
        <h2 className="mt-2 text-center text-xl text-black dark:text-white">
          Cargando formulario...
        </h2>
      </div>
    );
  }

  return (
    <div className="campus-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Eventos", to: "/admin/eventos" },
          { label: storedEvent?.title || "Evento" },
          { label: "Formulario" },
        ]}
        title="Formulario de registro"
        subtitle="Preguntas que responden los asistentes al inscribirse."
      />
      <Card>
        <EditableSection section="formulario">
          <FormBuilder
            key={form?.id || 'new'}
            formData={formData}
            onSave={(json) => saveRef.current(json)}
            disabled={!canEdit}
          />
        </EditableSection>
      </Card>
    </div>
  );
};

export default Dashboard;
