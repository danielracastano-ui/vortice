import { site } from '../config/site'

export interface LegalSection {
  heading: string
  body: string[]
}

export interface LegalDoc {
  title: string
  intro: string
  sections: LegalSection[]
}

const contactLine = site.contact.email
  ? `Puedes escribirnos a ${site.contact.email} o usar el formulario de contacto de este sitio.`
  : 'Puedes escribirnos mediante el formulario de contacto de este sitio.'

/**
 * Textos legales base, redactados a partir de lo que este sitio hace
 * técnicamente (un formulario de contacto, sin cookies de seguimiento ni
 * analítica de terceros).
 *
 * IMPORTANTE: son un punto de partida. Antes de publicar deben revisarse con
 * asesoría legal y completarse con la razón social, el domicilio y los
 * requisitos de la legislación aplicable en el país donde opera el negocio.
 */
export const legalDocs: Record<'privacidad' | 'terminos', LegalDoc> = {
  privacidad: {
    title: 'Aviso de privacidad',
    intro: `En ${site.name} respetamos tu privacidad. Este aviso explica qué datos personales recabamos a través de este sitio web, para qué los usamos y cómo puedes ejercer tus derechos sobre ellos.`,
    sections: [
      {
        heading: 'Responsable del tratamiento',
        body: [`${site.name} es responsable del tratamiento de los datos personales que nos proporcionas a través de este sitio. ${contactLine}`],
      },
      {
        heading: 'Datos que recabamos',
        body: [
          'Únicamente recabamos los datos que tú decides enviarnos mediante el formulario de contacto: nombre, correo electrónico, empresa u organización (opcional), los servicios que te interesan (opcional) y el contenido de tu mensaje.',
          'Junto con el mensaje se registra la dirección de la página desde la que se envió el formulario. No solicitamos datos sensibles; te pedimos no incluirlos en tu mensaje.',
        ],
      },
      {
        heading: 'Para qué usamos tus datos',
        body: [
          'Usamos tus datos para responder a tu solicitud, darle seguimiento y, en su caso, preparar una propuesta de trabajo. No los utilizamos para enviarte publicidad sin tu consentimiento ni para elaborar perfiles.',
        ],
      },
      {
        heading: 'Con quién los compartimos',
        body: [
          'No vendemos ni cedemos tus datos personales. Solo pueden acceder a ellos los proveedores tecnológicos que nos prestan servicios necesarios para operar: el servicio de alojamiento del sitio, por el que pasa el formulario, y el servicio de mensajería que nos hace llegar cada mensaje por WhatsApp. Ambos actúan conforme a nuestras instrucciones. También podrían acceder las autoridades cuando una obligación legal lo exija.',
        ],
      },
      {
        heading: 'Cookies y tecnologías de seguimiento',
        body: [
          'Este sitio no utiliza cookies publicitarias ni herramientas de analítica de terceros. Las tipografías y los recursos visuales se sirven desde el propio sitio.',
        ],
      },
      {
        heading: 'Conservación',
        body: [
          'Conservamos tus datos durante el tiempo necesario para atender tu solicitud y, si iniciamos una relación comercial, durante la vigencia de esta y los plazos que establezca la legislación aplicable.',
        ],
      },
      {
        heading: 'Tus derechos',
        body: [
          `Puedes solicitar en cualquier momento el acceso, la rectificación o la eliminación de tus datos personales, así como oponerte a su tratamiento o retirar tu consentimiento. ${contactLine} Responderemos a tu solicitud en los plazos que marque la normativa aplicable.`,
        ],
      },
      {
        heading: 'Cambios en este aviso',
        body: [
          'Podemos actualizar este aviso para reflejar cambios en nuestras prácticas o en la legislación. La versión vigente estará siempre disponible en esta página, con su fecha de última actualización.',
        ],
      },
    ],
  },
  terminos: {
    title: 'Términos y condiciones',
    intro: `Estos términos regulan el uso del sitio web de ${site.name}. Al navegar por él aceptas las condiciones descritas a continuación.`,
    sections: [
      {
        heading: 'Objeto del sitio',
        body: [
          `Este sitio tiene carácter informativo: presenta los servicios de ${site.name} y ofrece un medio de contacto. Su contenido no constituye una oferta contractual vinculante.`,
        ],
      },
      {
        heading: 'Contratación de servicios',
        body: [
          'Las condiciones de cada proyecto —alcance, plazos, entregables, precio y forma de pago— se acuerdan por escrito en una propuesta o contrato específico. En caso de discrepancia, ese documento prevalece sobre lo publicado en este sitio.',
        ],
      },
      {
        heading: 'Propiedad intelectual',
        body: [
          `El diseño, los textos, los elementos gráficos, las animaciones y el código de este sitio pertenecen a ${site.name} o a sus licenciantes, y están protegidos por la legislación de propiedad intelectual. No se permite su reproducción o reutilización sin autorización previa por escrito.`,
        ],
      },
      {
        heading: 'Uso permitido',
        body: [
          'Te comprometes a utilizar el sitio de forma lícita y a no realizar acciones que puedan dañarlo, sobrecargarlo o impedir su funcionamiento normal, ni a enviar contenido ilícito u ofensivo a través del formulario de contacto.',
        ],
      },
      {
        heading: 'Disponibilidad y responsabilidad',
        body: [
          'Procuramos que la información del sitio sea correcta y esté actualizada, y que el sitio esté disponible de forma continua, pero no podemos garantizar la ausencia de errores o interrupciones. En la medida que la ley lo permita, no asumimos responsabilidad por los daños derivados del uso del sitio.',
        ],
      },
      {
        heading: 'Enlaces a terceros',
        body: [
          'El sitio puede incluir enlaces a páginas de terceros. No controlamos su contenido ni sus políticas y no somos responsables de ellos.',
        ],
      },
      {
        heading: 'Privacidad',
        body: ['El tratamiento de tus datos personales se rige por nuestro aviso de privacidad, disponible en este mismo sitio.'],
      },
      {
        heading: 'Modificaciones',
        body: [
          'Podemos modificar estos términos en cualquier momento. La versión vigente será la publicada en esta página, con su fecha de última actualización.',
        ],
      },
    ],
  },
}
