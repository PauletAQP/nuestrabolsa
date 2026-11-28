```mermaid
erDiagram
    USUARIO ||--o{ BOLSA : "crea (admin)"
    USUARIO ||--o{ FAMILIA : "es padre en"
    USUARIO ||--o{ RESPONSABLE : "es comité en"
    USUARIO ||--o{ ESTUDIANTE : "es apoderado de"
    BOLSA ||--o{ FAMILIA : tiene
    BOLSA ||--o{ RESPONSABLE : tiene
    BOLSA ||--o{ INSCRIPCION : tiene
    BOLSA ||--o{ APORTE : recibe
    BOLSA ||--o{ PAGO : emite
    BOLSA ||--o{ REGISTRO : "cadena de"
    BOLSA ||--o{ RECORDATORIO : "envía"
    FAMILIA ||--o{ INSCRIPCION : inscribe
    ESTUDIANTE ||--o{ INSCRIPCION : "participa vía"
    FAMILIA ||--o{ APORTE : realiza
    ESTUDIANTE |o--o{ APORTE : "corresponde a"
    RESPONSABLE |o--o{ APORTE : "registra (efectivo)"
    RESPONSABLE |o--o{ APORTE : confirma
    RESPONSABLE ||--o{ PAGO : propone
    FAMILIA |o--o{ PAGO : "recibe devolución"
    PAGO ||--o{ APROBACION : requiere
    RESPONSABLE ||--o{ APROBACION : emite
    FAMILIA ||--o{ RECORDATORIO : "recibe"
    RESPONSABLE ||--o{ RECORDATORIO : "envía"
    APORTE |o--o| REGISTRO : "se asienta en"
    PAGO |o--o| REGISTRO : "se asienta en"

    USUARIO {
        string id PK
        string dni UK
        string nombre
        string apellidos
        string celular
        string dniFotoUri
        string contrasenaHash
        string contrasenaSalt
        boolean debeCambiarContrasena
        string recuperacionHash
        string recuperacionSalt
        enum rol "superadmin|admin|usuario"
    }
    BOLSA {
        string id PK
        string adminId FK
        string nombre
        string colegio
        decimal cuota
        string actaUri
        string codigoPublico UK
        string codigoInvitacion UK
        enum estado "activa|cerrada"
    }
    FAMILIA {
        string id PK
        string usuarioId FK
        string bolsaId FK
        enum estado "activa|retirada"
        datetime retiradaEn
    }
    RESPONSABLE {
        string id PK
        string usuarioId FK
        string bolsaId FK
        enum cargo "presidente|tesorero|secretario"
    }
    ESTUDIANTE {
        string id PK
        string apoderadoId FK
        string nombre
        string apellidos
    }
    INSCRIPCION {
        string id PK
        string bolsaId FK
        string familiaId FK
        string estudianteId FK
    }
    APORTE {
        string id PK
        string bolsaId FK
        string familiaId FK
        string estudianteId FK
        string registradoPorId FK "null = lo hizo el propio padre"
        string confirmadoPorId FK
        decimal monto
        enum medio "yape|plin|tarjeta|efectivo"
        enum estado "confirmado|por_confirmar"
        string codigoComprobante UK
    }
    PAGO {
        string id PK
        string bolsaId FK
        string proponenteId FK
        string familiaId FK "solo devoluciones"
        enum tipo "gasto|devolucion"
        decimal monto
        enum estado "pendiente|pagado|rechazado|vencido"
    }
    APROBACION {
        string id PK
        string pagoId FK
        string responsableId FK
        enum decision "aprobo|rechazo"
    }
    REGISTRO {
        string id PK
        string bolsaId FK
        enum tipo
        int secuencia
        string codigo UK
    }
    RECORDATORIO {
        string id PK
        string bolsaId FK
        string familiaId FK
        string enviadoPorId FK
        enum canal "whatsapp"
        decimal saldoPendiente
        datetime fecha
    }