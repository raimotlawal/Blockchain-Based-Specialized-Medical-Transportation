;; Vehicle Verification Contract
;; Validates appropriate medical equipment on board

;; Define data variables
(define-data-var admin principal tx-sender)

;; Define data maps
(define-map vehicles
  { vehicle-id: (string-ascii 36) }
  {
    owner: principal,
    vehicle-type: (string-ascii 50),
    equipment: (list 10 (string-ascii 50)),
    last-inspection-date: uint,
    certification-expiry: uint,
    active: bool
  }
)

;; Register a new vehicle
(define-public (register-vehicle
    (vehicle-id (string-ascii 36))
    (vehicle-type (string-ascii 50))
    (equipment (list 10 (string-ascii 50)))
    (certification-expiry uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (is-none (map-get? vehicles { vehicle-id: vehicle-id })) (err u100))
    (ok (map-set vehicles
      { vehicle-id: vehicle-id }
      {
        owner: tx-sender,
        vehicle-type: vehicle-type,
        equipment: equipment,
        last-inspection-date: block-height,
        certification-expiry: certification-expiry,
        active: true
      }
    ))
  )
)

;; Update vehicle equipment
(define-public (update-vehicle-equipment
    (vehicle-id (string-ascii 36))
    (equipment (list 10 (string-ascii 50))))
  (let ((vehicle-data (unwrap! (map-get? vehicles { vehicle-id: vehicle-id }) (err u404))))
    (asserts! (is-eq tx-sender (get owner vehicle-data)) (err u403))
    (ok (map-set vehicles
      { vehicle-id: vehicle-id }
      (merge vehicle-data {
        equipment: equipment,
        last-inspection-date: block-height
      })
    ))
  )
)

;; Record vehicle inspection
(define-public (record-inspection
    (vehicle-id (string-ascii 36))
    (certification-expiry uint))
  (let ((vehicle-data (unwrap! (map-get? vehicles { vehicle-id: vehicle-id }) (err u404))))
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (map-set vehicles
      { vehicle-id: vehicle-id }
      (merge vehicle-data {
        last-inspection-date: block-height,
        certification-expiry: certification-expiry
      })
    ))
  )
)

;; Deactivate vehicle
(define-public (deactivate-vehicle (vehicle-id (string-ascii 36)))
  (let ((vehicle-data (unwrap! (map-get? vehicles { vehicle-id: vehicle-id }) (err u404))))
    (asserts! (is-eq tx-sender (get owner vehicle-data)) (err u403))
    (ok (map-set vehicles
      { vehicle-id: vehicle-id }
      (merge vehicle-data { active: false })
    ))
  )
)

;; Read-only function to get vehicle info
(define-read-only (get-vehicle-info (vehicle-id (string-ascii 36)))
  (map-get? vehicles { vehicle-id: vehicle-id })
)

;; Check if vehicle certification is valid
(define-read-only (is-certification-valid (vehicle-id (string-ascii 36)))
  (match (map-get? vehicles { vehicle-id: vehicle-id })
    vehicle-data (and
                   (get active vehicle-data)
                   (< block-height (get certification-expiry vehicle-data)))
    false
  )
)

