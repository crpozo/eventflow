import Banner from "./components/Banner";

export default function Privacidad() {
  
  return (
    <>
      <div className="grid h-full">
        <Banner />
      </div>  

      <div className="ml-2">
        {/* Intro */}
        <h1 className="text-lg mb-3">Última actualización: 24 de octubre de 2023</h1>
        <div className="privacy-intro mb-4">
          <p className="mb-3">
            Este aviso de privacidad de Eventflow ("nosotros" o "nuestro"), describe cómo y por qué podemos recopilar, almacenar, utilizar y/o compartir ("procesar") su información cuando utiliza nuestros servicios ("Servicios"), por ejemplo cuando usted:
          </p>
          <ul className="list-disc ml-6 mb-3">
            <li className="mb-3">Descarga y utiliza nuestra aplicación móvil (Eventflow), o cualquier otra aplicación nuestra aplicación que enlace con este aviso de privacidad</li>
            <li className="mb-3">Se relaciona con nosotros de otras formas, como ventas, marketing o eventos.</li>
          </ul>
          <p>
          <span className="font-bold">¿Preguntas o dudas?</span> La lectura de este aviso de privacidad le ayudará a comprender sus
            sus derechos y opciones. Si no está de acuerdo con nuestras políticas y prácticas, por favor
            no utilice nuestros servicios. Si aún así tiene alguna pregunta o duda, póngase en contacto con info@eventflow.ec.
          </p>
        </div>
      </div>
      {/* Summary */}
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-3 font-semibold">Resumen de los puntos clave</h2>
        <p className="mb-3">¿Qué información personal procesamos? Cuando visita, utiliza o navega por nuestros Servicios, podemos procesar información personal dependiendo de cómo interactúe con nosotros y con los Servicios, de las elecciones que haga y de los productos y funciones que utilice.</p>
        <p className="mb-3"><span className="font-bold">¿Tratamos información personal sensible?</span> Si procesamos información personal sensible.</p>
        <p className="mb-3"><span className="font-bold">¿Recibimos información de terceros?</span> Podemos recibir información de bases de datos públicas, socios de marketing, plataformas de redes sociales y otras fuentes externas. Más información sobre la información recopilada de otras fuentes.</p>
        <p className="mb-3"><span className="font-bold">¿Cómo procesamos su información?</span> Procesamos su información para prestar, mejorar y administrar nuestros Servicios, comunicarnos con usted, por motivos de seguridad y prevención del fraude, y para cumplir la ley. También podemos procesar su información para otros fines con su consentimiento. Sólo procesamos su información cuando tenemos una razón legal válida para hacerlo. Obtenga más información sobre cómo procesamos su información.</p>
        <p className="mb-3"><span className="font-bold">¿En qué situaciones y con qué terceros compartimos información personal?</span> Podemos compartir información en situaciones específicas y con terceros específicos. Obtenga más información sobre cuándo y con quién compartimos su información personal.</p>
        <p className="mb-3"><span className="font-bold">¿Cómo mantenemos segura su información?</span> Disponemos de procesos y procedimientos organizativos y técnicos para proteger su información personal. Sin embargo, no se puede garantizar al 100% la seguridad de ninguna transmisión electrónica por Internet ni de ninguna tecnología de almacenamiento de información, por lo que no podemos prometer ni garantizar que piratas informáticos, ciberdelincuentes u otros terceros no autorizados no puedan burlar nuestra seguridad y recopilar, acceder, robar o modificar indebidamente su información.</p>
        <p className="mb-3"><span className="font-bold">¿Cuáles son sus derechos?</span> Dependiendo de dónde se encuentre geográficamente, la ley de privacidad aplicable puede significar que usted tiene ciertos derechos con respecto a su información personal.</p>
        <p className="mb-3"><span className="font-bold">¿Cómo puede ejercer sus derechos? </span>La forma más sencilla de ejercer sus derechos es presentando una solicitud de acceso a los datos o poniéndose en contacto con nosotros. Estudiaremos y atenderemos cualquier solicitud de conformidad con la legislación aplicable en materia de protección de datos.</p>
      </div>
      {/* Collect information */}
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-4 font-semibold">1.  ¿Qué información recolectamos?</h2>
        <h3 className="text-lg mb-3 font-semibold">Información personal que nos revele</h3>
        <p className="mb-3"><span className="font-bold">En resumen:</span> recopilamos la información personal que usted nos proporciona</p>
        <p className="mb-3">Recopilamos la información personal que usted nos proporciona voluntariamente cuando se registra en los Servicios, expresa su interés en obtener información sobre nosotros o sobre nuestros productos y Servicios, cuando participa en actividades en los Servicios o, de otro modo, cuando se pone en contacto con nosotros.</p>
        <p className="mb-3"><span className="font-bold">Formación personal proporcionada por usted.</span> La información personal que recopilamos depende del contexto de sus interacciones con nosotros y con los Servicios, de las elecciones que haga y de los productos y funciones que utilice. La información personal que recopilamos puede incluir lo siguiente:</p>
        <ul className="list-disc ml-6 mb-3">
          <li className="mb-3">nombres</li>
          <li className="mb-3">números de teléfono</li>
          <li className="mb-3">direcciones de correo electrónico</li>
          <li className="mb-3">direcciones postales</li>
          <li className="mb-3">preferencias de contacto</li>
          <li className="mb-3">direcciones de facturación</li>
        </ul>
        <p className="mb-3"><span className="font-bold">Información sensible.</span>Si procesamos información sensible.</p>
        <p className="mb-3"><span className="font-bold">Datos de la aplicación.</span>   Si utiliza nuestra(s) aplicación(es), también podemos recopilar la siguiente información si decide proporcionarnos acceso o permiso:</p>
        <ul className="list-disc ml-6 mb-3">
          <li className="mb-3">Acceso a dispositivos móviles. Podemos solicitar acceso o permiso a determinadas funciones de su dispositivo móvil, como la cámara, el bluetooth y otras funciones. Si desea cambiar nuestro acceso o permisos, puede hacerlo en la configuración de su dispositivo.</li>
          <li className="mb-3">Notificaciones push. Podemos solicitarle que nos envíe notificaciones push relativas a su cuenta o a determinadas funciones de la(s) aplicación(es). Si no desea recibir este tipo de comunicaciones, puede desactivarlas en la configuración de su dispositivo.</li>
        </ul>
        <p className="mb-3">Esta información es necesaria principalmente para mantener la seguridad y el funcionamiento de nuestra(s) aplicación(es), para la resolución de problemas y para nuestros análisis internos y la elaboración de informes.</p>
        <p className="mb-3">Toda la información personal que nos proporcione debe ser verdadera, completa y exacta, y debe notificarnos cualquier cambio en dicha información personal.</p>
        <h3 className="text-lg mb-3 font-semibold">Información recopilada automáticamente</h3>
        <p className="mb-3"><span className="font-bold">En resumen:</span> Cierta información -como su dirección de Protocolo de Internet (IP) y/o las características de su navegador y dispositivo- se recopila automáticamente cuando visita nuestros Servicios.</p>
        <p className="mb-3">Recopilamos automáticamente cierta información cuando usted visita, utiliza o navega por los Servicios. Esta información no revela su identidad específica (como su nombre o información de contacto), pero puede incluir información del dispositivo y de uso, como su dirección IP, características del navegador y del dispositivo, sistema operativo, preferencias de idioma, URL de referencia, nombre del dispositivo, país, ubicación, información sobre cómo y cuándo utiliza nuestros Servicios y otra información técnica. Esta información es necesaria principalmente para mantener la seguridad y el funcionamiento de nuestros Servicios, así como para nuestros análisis internos y la elaboración de informes.</p>
        <p className="mb-3">Como muchas empresas, también recopilamos información a través de cookies y tecnologías similares.</p>
        <p className="mb-3">La información que recopilamos incluye:</p>
        <ul className="list-disc ml-6 mb-3">
          <li className="mb-3">Datos de registro y uso. Los datos de registro y uso son información relacionada con el servicio, el diagnóstico, el uso y el rendimiento que nuestros servidores recopilan automáticamente cuando usted accede o utiliza nuestros Servicios y que registramos en archivos de registro. Dependiendo de cómo interactúe con nosotros, estos datos de registro pueden incluir su dirección IP, información del dispositivo, tipo de navegador y configuración e información sobre su actividad en los Servicios (como las marcas de fecha/hora asociadas a su uso, páginas y archivos vistos, búsquedas y otras acciones que realice, como las funciones que utiliza), información de eventos del dispositivo (como actividad del sistema, informes de errores (a veces denominados "crash dumps") y configuración del hardware).</li>
          <li className="mb-3">Datos del dispositivo. Recopilamos datos de dispositivos tales como información sobre su ordenador, teléfono, tableta u otro dispositivo que utilice para acceder a los Servicios. Dependiendo del dispositivo utilizado, estos datos del dispositivo pueden incluir información como su dirección IP (o servidor proxy), números de identificación del dispositivo y de la aplicación, ubicación, tipo de navegador, modelo de hardware, proveedor de servicios de Internet y/o operador de telefonía móvil, sistema operativo e información de configuración del sistema.</li>
          <li className="mb-3">Datos de localización. Recopilamos datos de localización, como información sobre la ubicación de su dispositivo, que puede ser precisa o imprecisa. La cantidad de información que recopilamos depende del tipo y la configuración del dispositivo que utiliza para acceder a los Servicios. Por ejemplo, podemos utilizar el GPS y otras tecnologías para recopilar datos de geolocalización que nos indican su ubicación actual (basada en su dirección IP). Usted puede optar por no permitirnos recopilar esta información denegando el acceso a la información o desactivando la configuración de Localización en su dispositivo. Sin embargo, si decide no hacerlo, es posible que no pueda utilizar determinados aspectos de los Servicios.</li>
        </ul>
        <h3 className="text-lg mb-3 font-semibold">Información recogida de otras fuentes</h3>
        <p className="mb-3"><span className="font-bold">En resumen:</span> podemos recopilar datos limitados de bases de datos públicas, socios de marketing y otras fuentes externas.</p>
        <p className="mb-3"> Con el fin de mejorar nuestra capacidad para proporcionarle marketing, ofertas y servicios relevantes y actualizar nuestros registros, podemos obtener información sobre usted de otras fuentes, como bases de datos públicas, socios de marketing conjunto, programas de afiliación, proveedores de datos y otros terceros. Esta información incluye direcciones postales, cargos, direcciones de correo electrónico, números de teléfono, datos de intención (o datos de comportamiento del usuario), direcciones de protocolo de Internet (IP), perfiles de redes sociales, URL de redes sociales y perfiles personalizados, con fines de publicidad dirigida y promoción de eventos.</p>
      </div>
      {/* Process information */}
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-4 font-semibold">2.  ¿Cómo procesamos su información?</h2>
        <p className="mb-3"><span className="font-bold">En resumen:</span> procesamos su información para proporcionar, mejorar y administrar nuestros Servicios, comunicarnos con usted, para la seguridad y la prevención del fraude y para cumplir la ley. También podemos procesar su información para otros fines con su consentimiento.</p> 

        <p className="mb-3"><span className="font-semibold">Tratamos su información personal por diversas razones, dependiendo de cómo interactúe con nuestros Servicios, entre ellas:</span></p> 

        <ul className="list-disc ml-6 mb-3">
          <li className="mb-3"><span className="font-semibold">Para facilitar la creación y autenticación de cuentas y gestionar de otro modo las cuentas de usuario.</span> Podemos procesar su información para que pueda crear e iniciar sesión en su cuenta, así como para mantener su cuenta en funcionamiento.</li>
          <li className="mb-3"><span className="font-semibold">Prestar y facilitar la prestación de servicios al usuario.</span> Podemos procesar su información para prestarle el servicio solicitado.</li>
          <li className="mb-3"><span className="font-semibold">Para evaluar y mejorar nuestros Servicios, productos, marketing y su experiencia.</span>Podemos procesar su información cuando lo consideremos necesario para identificar tendencias de uso, determinar la eficacia de nuestras campañas promocionales y evaluar y mejorar nuestros Servicios, productos, marketing y su experiencia.</li>
        </ul>
      </div>
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-4 font-semibold">3.  ¿Cúando y con quién compartimos sus datos personales?</h2>
        <p className="mb-3"><span className="font-bold">En resumen:</span>Podemos compartir información en situaciones específicas descritas en esta sección y/o con los siguientes terceros.</p> 
        <p className="mb-3">Es posible que tengamos que compartir su información personal en las siguientes situaciones:</p> 
        <ul className="list-disc ml-6 mb-3">
          <li className="mb-3"><span className="font-semibold">Transferencias empresariales.</span> Podemos compartir o transferir su información en relación con, o durante las negociaciones de, cualquier fusión, venta de activos de la empresa, financiación o adquisición de la totalidad o una parte de nuestro negocio a otra empresa.</li>
          <li className="mb-3"><span className="font-semibold">Muro de ofertas.</span> Nuestra(s) aplicación(es) puede(n) mostrar un "muro de ofertas" alojado por terceros. Dicho muro de ofertas permite a los anunciantes de terceros ofrecer moneda virtual, regalos u otros artículos a los usuarios a cambio de la aceptación y finalización de una oferta publicitaria. Este tipo de muro de ofertas puede aparecer en nuestras aplicaciones y mostrársele a usted en función de determinados datos, como su zona geográfica o información demográfica. Al hacer clic en un muro de ofertas, accederá a un sitio web externo perteneciente a otras personas y abandonará nuestra(s) aplicación(es). Se compartirá un identificador único, como su ID de usuario, con el proveedor del muro de ofertas a fin de evitar fraudes y abonar correctamente en su cuenta la recompensa correspondiente.</li>
        </ul>
      </div>
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-4 font-semibold">4.  ¿Utilizamos cookies y otras tecnologías de seguimiento?</h2>
        <p className="mb-3"><span className="font-bold">En resumen:</span>podemos utilizar cookies y otras tecnologías de seguimiento para recopilar y almacenar su información.</p> 
        <p className="mb-3">Podemos utilizar cookies y tecnologías de seguimiento similares (como balizas web y píxeles) para acceder a la información o almacenarla. En nuestro Aviso sobre cookies encontrará información específica sobre cómo utilizamos dichas tecnologías y cómo puede rechazar determinadas cookies.</p> 
      </div>
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-4 font-semibold">5.  ¿Cúanto tiempo conservamos sus datos?</h2>
        <p className="mb-3"><span className="font-bold">En resumen:</span> podemos utilizar cookies y otras tecnologías de seguimiento para recopilar y almacenar su información.</p> 
        <p className="mb-3">conservamos su información durante el tiempo necesario para cumplir los fines descritos en este aviso de privacidad, a menos que la ley exija lo contrario.</p> 
        <p className="mb-3">Sólo conservaremos su información personal durante el tiempo que sea necesario para los fines establecidos en este aviso de privacidad, a menos que la ley exija o permita un período de conservación más largo (como requisitos fiscales, contables u otros requisitos legales). Ninguna de las finalidades previstas en este aviso nos obligará a conservar sus datos personales durante más tiempo que el que los usuarios tengan una cuenta con nosotros.</p> 
        <p className="mb-3">Cuando ya no tengamos ninguna necesidad comercial legítima de procesar su información personal, eliminaremos o anonimizaremos dicha información o, si esto no es posible (por ejemplo, porque su información personal se ha almacenado en archivos de copia de seguridad), almacenaremos de forma segura su información personal y la aislaremos de cualquier procesamiento posterior hasta que sea posible eliminarla.</p> 
      </div>
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-4 font-semibold">6.  ¿Cómo mantenemos segura su información?</h2>
        <p className="mb-3"><span className="font-bold">En resumen:</span> nuestro objetivo es proteger su información personal mediante un sistema de medidas de seguridad organizativas y técnicas.</p> 
        <p className="mb-3">Hemos implantado medidas de seguridad técnicas y organizativas adecuadas y razonables, diseñadas para proteger la seguridad de cualquier información personal que procesemos. Sin embargo, a pesar de nuestras salvaguardas y esfuerzos por asegurar su información, no se puede garantizar que ninguna transmisión electrónica por Internet o tecnología de almacenamiento de información sea 100% segura, por lo que no podemos prometer ni garantizar que piratas informáticos, ciberdelincuentes u otros terceros no autorizados no puedan burlar nuestra seguridad y recopilar, acceder, robar o modificar indebidamente su información. Aunque haremos todo lo posible para proteger su información personal, la transmisión de información personal hacia y desde nuestros Servicios corre por su cuenta y riesgo. Sólo debe acceder a los Servicios en un entorno seguro.</p> 
      </div>
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-4 font-semibold">7.  ¿Cuáles son sus derechos de privacidad?</h2>
        <p className="mb-3"><span className="font-bold">En resumen:</span> Puede revisar, modificar o cancelar su cuenta en cualquier momento.</p> 
        <p className="mb-3">Retirada de su consentimiento: Si nos basamos en su consentimiento para procesar su información personal, que puede ser un consentimiento expreso y/o implícito en función de la legislación aplicable, tiene derecho a retirar su consentimiento en cualquier momento. Puede retirar su consentimiento en cualquier momento poniéndose en contacto con nosotros a través de los datos de contacto facilitados en la sección "¿CÓMO PUEDE CONTACTAR CON NOSOTROS EN RELACIÓN CON ESTE AVISO?" que figura a continuación.</p> 
        <p className="mb-3">No obstante, tenga en cuenta que esto no afectará a la legalidad del tratamiento anterior a su retirada ni, cuando la legislación aplicable lo permita, afectará al tratamiento de su información personal realizado sobre la base de motivos legales de tratamiento distintos del consentimiento.</p> 
        <p className="mb-3"><span className="font-bold">Información sobre la cuenta</span></p> 
        <p className="mb-3">Si en cualquier momento desea revisar o modificar la información de su cuenta o cancelarla, puede hacerlo:</p> 
        <ul className="list-disc ml-6 mb-3">
          <li className="mb-3">Póngase en contacto con nosotros utilizando la información de contacto facilitada.</li>
          <li className="mb-3">info@eventflow.ec</li>
        </ul>
        <p className="mb-3">Cuando solicite la cancelación de su cuenta, desactivaremos o eliminaremos su cuenta e información de nuestras bases de datos activas. No obstante, es posible que conservemos parte de la información en nuestros archivos para evitar fraudes, solucionar problemas, ayudar en cualquier investigación, hacer cumplir nuestras condiciones legales y/o cumplir los requisitos legales aplicables.</p> 
        <p className="mb-3">Cookies y tecnologías similares: La mayoría de los navegadores web están configurados para aceptar cookies por defecto. Si lo prefiere, puede configurar su navegador para que elimine las cookies y las rechace. Si decide eliminar las cookies o rechazarlas, esto podría afectar a determinadas funciones o servicios de nuestros Servicios.</p> 
        <p className="mb-3">Si tiene preguntas o comentarios sobre sus derechos de privacidad, puede enviarnos un correo electrónico a info@eventflow.ec.</p> 
      </div>
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-4 font-semibold">8.  ¿Controles para la función "no rastrear"?</h2>
        <p className="mb-3">La mayoría de los navegadores web y algunos sistemas operativos y aplicaciones para móviles incluyen una función o configuración de No rastrear ("DNT", Do-Not-Track) que usted puede activar para señalar su preferencia de privacidad para que no se controlen ni recopilen datos sobre sus actividades de navegación en línea. Por el momento, no se ha ultimado ninguna norma tecnológica uniforme para reconocer y aplicar las señales DNT. Por lo tanto, actualmente no respondemos a las señales DNT del navegador ni a ningún otro mecanismo que comunique automáticamente su elección de no ser rastreado en línea. Si en el futuro se adopta una norma para el seguimiento en línea que debamos seguir, le informaremos sobre dicha práctica en una versión revisada de este aviso de privacidad.</p> 
      </div>
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-4 font-semibold">9.  ¿se actualiza este aviso?</h2>
        <p className="mb-3"><span className="font-bold">En resumen:</span> Sí, actualizaremos este aviso cuando sea necesario para seguir cumpliendo la legislación pertinente.</p> 
        <p className="mb-3">Podemos actualizar este aviso de privacidad de vez en cuando. La versión actualizada se indicará mediante una fecha "Revisada" actualizada y la versión actualizada entrará en vigor tan pronto como sea accesible. Si introducimos cambios sustanciales en este aviso de privacidad, se lo notificaremos publicando un aviso de dichos cambios en un lugar destacado o enviándole directamente una notificación. Le recomendamos que revise este aviso de privacidad con frecuencia para estar informado de cómo protegemos su información.</p> 
      </div>
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-4 font-semibold">10.  ¿Cómo puede ponerse en contacto con nosotros en realación con este aviso?</h2>
        <p className="mb-3"> Si tiene preguntas o comentarios sobre este aviso, puede enviarnos un correo electrónico a info@eventflow.ec o ponerse en contacto con nosotros por correo postal en:</p> 
        <ul className="list-disc ml-6 mb-3">
          <li>Carlos Pozo</li>
          <li>La Carolina</li>
          <li>Quito, Pichincha 170518</li>
          <li>Ecuador</li>
        </ul>
      </div>
      <div className="privacy-summary mb-4">
        <h2 className="text-2xl mb-4 font-semibold">11.  ¿Cómo puede revisar, actualizar o eliminar los datos que recopilamos sobre usted?</h2>
        <p className="mb-3">En función de la legislación aplicable en su país, puede tener derecho a solicitar acceso a la información personal que recopilamos sobre usted, a modificarla o a eliminarla. Para solicitar la revisión, actualización o eliminación de su información personal, rellene y envíe una solicitud de acceso a los datos.</p>
      </div>
    </>
  );
}
