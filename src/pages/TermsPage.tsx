import { LegalLayout } from '../components/legal/LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Terminos de Servicio" updatedAt="22 de octubre de 2026">
      <p>
        Estos Terminos de Servicio ("Terminos") rigen el uso de SICOFAC, una plataforma de facturacion
        electronica para el Servicio de Rentas Internas (SRI) del Ecuador, operada por{' '}
        <strong>[Razon social de la empresa operadora — completar antes de publicar]</strong>, RUC{' '}
        <strong>[RUC de la empresa operadora]</strong>. Al crear una cuenta aceptas estos Terminos y la{' '}
        <a href="/privacidad">Politica de Privacidad</a>.
      </p>

      <h2>1. El servicio</h2>
      <p>
        SICOFAC permite a una empresa ("la Empresa", "tu empresa") generar, firmar electronicamente
        (XAdES-BES) y transmitir al SRI comprobantes electronicos (facturas y, progresivamente, otros
        documentos), ademas de gestionar clientes, productos y un punto de venta. SICOFAC es una
        herramienta: la exactitud de los datos fiscales que emitis (RUC, items, valores, impuestos) es
        tu responsabilidad como contribuyente. SICOFAC no sustituye asesoria contable o tributaria.
      </p>

      <h2>2. Cuenta y empresa</h2>
      <p>
        Al registrarte creas una cuenta de usuario y, en el mismo paso, la empresa (facturador) que vas
        a operar. Sos responsable de mantener la confidencialidad de tu contrasena y de la actividad que
        ocurra bajo tu cuenta. Podes invitar a otros usuarios a tu empresa con distintos roles (propietario,
        administrador, vendedor); cada rol tiene permisos distintos dentro de la plataforma.
      </p>

      <h2>3. Planes y limites</h2>
      <p>
        El acceso se ofrece por planes con un cupo fijo de documentos emitidos por mes, establecimientos
        y usuarios, segun el plan contratado. Estos limites son topes duros: al alcanzarlos, la emision de
        nuevos documentos o la invitacion de nuevos usuarios queda bloqueada hasta el siguiente ciclo o
        hasta que actualices de plan. Los planes se cobran por ciclo anual. El plan Empresa es a medida y
        se contrata directamente con nuestro equipo comercial.
      </p>

      <h2>4. Certificado de firma electronica</h2>
      <p>
        Para firmar comprobantes necesitas cargar tu certificado digital (.p12) emitido por una entidad
        de certificacion autorizada en Ecuador. SICOFAC almacena ese certificado y su contrasena de forma
        cifrada y los usa exclusivamente para firmar tus propios documentos. Sos responsable de que el
        certificado este vigente y de notificarnos si sospechas que fue comprometido.
      </p>

      <h2>5. Uso aceptable</h2>
      <p>
        No esta permitido: usar la plataforma para emitir comprobantes fraudulentos o con datos falsos,
        intentar vulnerar el aislamiento entre empresas (multi-tenant), revender el acceso sin autorizacion,
        ni usar las credenciales de otra empresa o usuario sin consentimiento. Nos reservamos el derecho de
        suspender cuentas que incumplan esto.
      </p>

      <h2>6. Disponibilidad del servicio</h2>
      <p>
        Hacemos un esfuerzo razonable para mantener SICOFAC disponible, pero la emision final de un
        comprobante depende de los servicios web del SRI, que estan fuera de nuestro control. No
        garantizamos disponibilidad ininterrumpida del SRI ni tiempos de respuesta de sus sistemas.
      </p>

      <h2>7. Suspension y terminacion</h2>
      <p>
        Podemos suspender o cancelar una cuenta por incumplimiento de estos Terminos, falta de pago, o uso
        indebido de la plataforma. Podes cancelar tu cuenta en cualquier momento contactando a soporte; los
        comprobantes ya emitidos y autorizados por el SRI siguen siendo tu responsabilidad y propiedad,
        independientemente de la cancelacion.
      </p>

      <h2>8. Limitacion de responsabilidad</h2>
      <p>
        SICOFAC se provee "como esta". En la maxima medida permitida por la ley ecuatoriana, no somos
        responsables por sanciones tributarias, multas o perjuicios derivados de datos incorrectos
        ingresados por el usuario, interrupciones de los servicios del SRI, o uso indebido de la
        plataforma por parte de terceros con acceso a tu cuenta.
      </p>

      <h2>9. Cambios a estos Terminos</h2>
      <p>
        Podemos actualizar estos Terminos para reflejar cambios en el servicio o en la normativa
        aplicable. Si el cambio es sustancial, te lo notificaremos por correo o dentro de la plataforma
        antes de que entre en vigencia.
      </p>

      <h2>10. Ley aplicable</h2>
      <p>
        Estos Terminos se rigen por las leyes de la Republica del Ecuador. Cualquier controversia se
        resolvera ante los jueces competentes de Ecuador.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Consultas sobre estos Terminos: <strong>[correo de contacto legal — completar]</strong>.
      </p>
    </LegalLayout>
  )
}
