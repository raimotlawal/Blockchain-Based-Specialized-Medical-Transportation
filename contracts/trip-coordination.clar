;; Trip Coordination Contract
;; Manages scheduling and routing of services

;; Define data variables
(define-data-var admin principal tx-sender)

;; Define trip status constants
(define-constant STATUS-REQUESTED u1)
(define-constant STATUS-ASSIGNED u2)
(define-constant STATUS-IN-PROGRESS u3)
(define-constant STATUS-COMPLETED u4)
(define-constant STATUS-CANCELLED u5)

;; Define data maps
(define-map trips
  { trip-id: (string-ascii 36) }
  {
    patient-id: (string-ascii 36),
    driver-id: (optional (string-ascii 36)),
    vehicle-id: (optional (string-ascii 36)),
    pickup-location: (string-ascii 100),
    destination: (string-ascii 100),
    scheduled-time: uint,
    status: uint,
    special-requirements: (string-ascii 100),
    created-at: uint,
    updated-at: uint
  }
)

;; Request a new trip
(define-public (request-trip
    (trip-id (string-ascii 36))
    (patient-id (string-ascii 36))
    (pickup-location (string-ascii 100))
    (destination (string-ascii 100))
    (scheduled-time uint)
    (special-requirements (string-ascii 100)))
  (begin
    (asserts! (is-none (map-get? trips { trip-id: trip-id })) (err u100))
    (ok (map-set trips
      { trip-id: trip-id }
      {
        patient-id: patient-id,
        driver-id: none,
        vehicle-id: none,
        pickup-location: pickup-location,
        destination: destination,
        scheduled-time: scheduled-time,
        status: STATUS-REQUESTED,
        special-requirements: special-requirements,
        created-at: block-height,
        updated-at: block-height
      }
    ))
  )
)

;; Assign driver and vehicle to trip
(define-public (assign-trip
    (trip-id (string-ascii 36))
    (driver-id (string-ascii 36))
    (vehicle-id (string-ascii 36)))
  (let ((trip-data (unwrap! (map-get? trips { trip-id: trip-id }) (err u404))))
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (is-eq (get status trip-data) STATUS-REQUESTED) (err u401))
    (ok (map-set trips
      { trip-id: trip-id }
      (merge trip-data {
        driver-id: (some driver-id),
        vehicle-id: (some vehicle-id),
        status: STATUS-ASSIGNED,
        updated-at: block-height
      })
    ))
  )
)

;; Update trip status
(define-public (update-trip-status
    (trip-id (string-ascii 36))
    (status uint))
  (let ((trip-data (unwrap! (map-get? trips { trip-id: trip-id }) (err u404))))
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (and (>= status STATUS-REQUESTED) (<= status STATUS-CANCELLED)) (err u400))
    (ok (map-set trips
      { trip-id: trip-id }
      (merge trip-data {
        status: status,
        updated-at: block-height
      })
    ))
  )
)

;; Cancel trip
(define-public (cancel-trip (trip-id (string-ascii 36)))
  (let ((trip-data (unwrap! (map-get? trips { trip-id: trip-id }) (err u404))))
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (< (get status trip-data) STATUS-COMPLETED) (err u401))
    (ok (map-set trips
      { trip-id: trip-id }
      (merge trip-data {
        status: STATUS-CANCELLED,
        updated-at: block-height
      })
    ))
  )
)

;; Read-only function to get trip info
(define-read-only (get-trip-info (trip-id (string-ascii 36)))
  (map-get? trips { trip-id: trip-id })
)

