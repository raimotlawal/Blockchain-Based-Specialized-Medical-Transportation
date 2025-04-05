;; Driver Certification Contract
;; Confirms training for medical transport

;; Define data variables
(define-data-var admin principal tx-sender)

;; Define data maps
(define-map drivers
  { driver-id: (string-ascii 36) }
  {
    principal: principal,
    name: (string-ascii 100),
    certifications: (list 10 (string-ascii 50)),
    training-completion: uint,
    certification-expiry: uint,
    active: bool
  }
)

;; Register a new driver
(define-public (register-driver
    (driver-id (string-ascii 36))
    (name (string-ascii 100))
    (certifications (list 10 (string-ascii 50)))
    (certification-expiry uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (is-none (map-get? drivers { driver-id: driver-id })) (err u100))
    (ok (map-set drivers
      { driver-id: driver-id }
      {
        principal: tx-sender,
        name: name,
        certifications: certifications,
        training-completion: block-height,
        certification-expiry: certification-expiry,
        active: true
      }
    ))
  )
)

;; Update driver certifications
(define-public (update-driver-certifications
    (driver-id (string-ascii 36))
    (certifications (list 10 (string-ascii 50)))
    (certification-expiry uint))
  (let ((driver-data (unwrap! (map-get? drivers { driver-id: driver-id }) (err u404))))
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (map-set drivers
      { driver-id: driver-id }
      (merge driver-data {
        certifications: certifications,
        training-completion: block-height,
        certification-expiry: certification-expiry
      })
    ))
  )
)

;; Deactivate driver
(define-public (deactivate-driver (driver-id (string-ascii 36)))
  (let ((driver-data (unwrap! (map-get? drivers { driver-id: driver-id }) (err u404))))
    (asserts! (or (is-eq tx-sender (get principal driver-data)) (is-eq tx-sender (var-get admin))) (err u403))
    (ok (map-set drivers
      { driver-id: driver-id }
      (merge driver-data { active: false })
    ))
  )
)

;; Read-only function to get driver info
(define-read-only (get-driver-info (driver-id (string-ascii 36)))
  (map-get? drivers { driver-id: driver-id })
)

;; Check if driver certification is valid
(define-read-only (is-certification-valid (driver-id (string-ascii 36)))
  (match (map-get? drivers { driver-id: driver-id })
    driver-data (and
                  (get active driver-data)
                  (< block-height (get certification-expiry driver-data)))
    false
  )
)

