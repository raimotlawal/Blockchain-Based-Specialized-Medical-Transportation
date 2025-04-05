;; Patient Registration Contract
;; Records transportation needs and requirements

;; Define data variables
(define-data-var admin principal tx-sender)

;; Define data maps
(define-map patients
  { patient-id: (string-ascii 36) }
  {
    owner: principal,
    medical-condition: (string-ascii 100),
    equipment-needs: (string-ascii 100),
    mobility-status: (string-ascii 50),
    emergency-contact: (string-ascii 100),
    active: bool
  }
)

;; Register a new patient
(define-public (register-patient
    (patient-id (string-ascii 36))
    (medical-condition (string-ascii 100))
    (equipment-needs (string-ascii 100))
    (mobility-status (string-ascii 50))
    (emergency-contact (string-ascii 100)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (is-none (map-get? patients { patient-id: patient-id })) (err u100))
    (ok (map-set patients
      { patient-id: patient-id }
      {
        owner: tx-sender,
        medical-condition: medical-condition,
        equipment-needs: equipment-needs,
        mobility-status: mobility-status,
        emergency-contact: emergency-contact,
        active: true
      }
    ))
  )
)

;; Update patient information
(define-public (update-patient-info
    (patient-id (string-ascii 36))
    (medical-condition (string-ascii 100))
    (equipment-needs (string-ascii 100))
    (mobility-status (string-ascii 50))
    (emergency-contact (string-ascii 100)))
  (let ((patient-data (unwrap! (map-get? patients { patient-id: patient-id }) (err u404))))
    (asserts! (is-eq tx-sender (get owner patient-data)) (err u403))
    (ok (map-set patients
      { patient-id: patient-id }
      (merge patient-data {
        medical-condition: medical-condition,
        equipment-needs: equipment-needs,
        mobility-status: mobility-status,
        emergency-contact: emergency-contact
      })
    ))
  )
)

;; Deactivate patient
(define-public (deactivate-patient (patient-id (string-ascii 36)))
  (let ((patient-data (unwrap! (map-get? patients { patient-id: patient-id }) (err u404))))
    (asserts! (is-eq tx-sender (get owner patient-data)) (err u403))
    (ok (map-set patients
      { patient-id: patient-id }
      (merge patient-data { active: false })
    ))
  )
)

;; Read-only function to get patient info
(define-read-only (get-patient-info (patient-id (string-ascii 36)))
  (map-get? patients { patient-id: patient-id })
)

