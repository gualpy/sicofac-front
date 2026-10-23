import { LegalLayout } from '../components/legal/LegalLayout'

export function PrivacyPage() {
  return (
    <LegalLayout title="Politica de Privacidad" updatedAt="22 de octubre de 2026">
      <p>
        Esta Politica de Privacidad explica que datos personales trata SICOFAC, con que finalidad y que
        derechos tenes al respecto, conforme a la Ley Organica de Proteccion de Datos Personales (LOPDP)
        del Ecuador. El responsable del tratamiento es{' '}
        <strong>[Razon social de la empresa operadora — completar antes de publicar]</strong>, RUC{' '}
        <strong>[RUC de la empresa operadora]</strong>.
      </p>

      <h2>1. Datos que recopilamos</h2>
      <ul>
        <li>
          <strong>De tu cuenta:</strong> nombre, correo electronico y contrasena (almacenada con hash,
          nunca en texto plano).
        </li>
        <li>
          <strong>De tu empresa:</strong> razon social, RUC, direccion, telefono, ambiente SRI (pruebas o
          produccion), y el certificado de firma digital (.p12) con su contrasena, almacenados cifrados.
        </li>
        <li>
          <strong>De los clientes de tu empresa:</strong> los datos que incluis en cada comprobante
          (identificacion, nombre, correo, direccion del comprador), porque son exigidos por el SRI para
          la emision fiscal.
        </li>
        <li>
          <strong>De uso de la plataforma:</strong> direccion IP, user agent y un registro de auditoria de
          acciones sensibles (creacion de facturas, cambios de configuracion, invitaciones), para seguridad
          y trazabilidad.
        </li>
      </ul>

      <h2>2. Para que usamos tus datos</h2>
      <p>
        Para prestarte el servicio de facturacion electronica (generar, firmar y transmitir comprobantes al
        SRI), administrar tu cuenta y plan, darte soporte, cumplir obligaciones legales y tributarias que
        nos exige la normativa ecuatoriana, y mejorar la plataforma. No vendemos tus datos a terceros ni
        los usamos con fines publicitarios ajenos a SICOFAC.
      </p>

      <h2>3. Con quien los compartimos</h2>
      <p>
        Compartimos los datos del comprobante con el SRI porque la ley lo exige para la autorizacion
        fiscal. Usamos proveedores de infraestructura (hosting, base de datos) y de envio de correo
        transaccional (confirmacion de cuenta, invitaciones) que actuan como encargados del tratamiento
        bajo nuestras instrucciones, nunca como duenos de los datos.
      </p>

      <h2>4. Cuanto tiempo conservamos los datos</h2>
      <p>
        Mientras tu cuenta este activa. Los comprobantes electronicos y su informacion asociada se
        conservan ademas por el plazo que exige la normativa tributaria ecuatoriana, incluso despues de
        que canceles tu cuenta, porque la obligacion de conservacion es legal, no contractual.
      </p>

      <h2>5. Tus derechos</h2>
      <p>
        Conforme a la LOPDP, podes solicitar acceso, rectificacion, actualizacion o eliminacion de tus
        datos personales, asi como revocar un consentimiento previamente otorgado, salvo que exista una
        obligacion legal que nos impida eliminarlos (por ejemplo, los comprobantes ya emitidos ante el
        SRI). Para ejercer estos derechos escribinos a{' '}
        <strong>[correo de contacto de proteccion de datos — completar]</strong>.
      </p>

      <h2>6. Seguridad</h2>
      <p>
        Las contrasenas se almacenan con hash, los certificados de firma digital y sus contrasenas se
        almacenan cifrados, y el acceso entre empresas (tenants) esta aislado a nivel de autorizacion: un
        usuario solo ve los datos de las empresas a las que pertenece.
      </p>

      <h2>7. Menores de edad</h2>
      <p>SICOFAC no esta dirigido a menores de edad y no recopila deliberadamente datos de menores.</p>

      <h2>8. Cambios a esta politica</h2>
      <p>
        Si hacemos cambios relevantes a esta politica te lo notificaremos por correo o dentro de la
        plataforma antes de que entren en vigencia.
      </p>
    </LegalLayout>
  )
}
