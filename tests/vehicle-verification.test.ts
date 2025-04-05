import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract interactions
const mockVehicles = new Map()
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockAdmin = mockTxSender
const mockBlockHeight = 100

// Mock contract functions
const mockContractFunctions = {
  registerVehicle: (vehicleId, vehicleType, equipment, certificationExpiry) => {
    if (mockTxSender !== mockAdmin) {
      return { error: 403 }
    }
    
    if (mockVehicles.has(vehicleId)) {
      return { error: 100 }
    }
    
    mockVehicles.set(vehicleId, {
      owner: mockTxSender,
      vehicleType,
      equipment,
      lastInspectionDate: mockBlockHeight,
      certificationExpiry,
      active: true,
    })
    
    return { success: true }
  },
  
  updateVehicleEquipment: (vehicleId, equipment) => {
    if (!mockVehicles.has(vehicleId)) {
      return { error: 404 }
    }
    
    const vehicle = mockVehicles.get(vehicleId)
    if (vehicle.owner !== mockTxSender) {
      return { error: 403 }
    }
    
    mockVehicles.set(vehicleId, {
      ...vehicle,
      equipment,
      lastInspectionDate: mockBlockHeight,
    })
    
    return { success: true }
  },
  
  recordInspection: (vehicleId, certificationExpiry) => {
    if (!mockVehicles.has(vehicleId)) {
      return { error: 404 }
    }
    
    if (mockTxSender !== mockAdmin) {
      return { error: 403 }
    }
    
    const vehicle = mockVehicles.get(vehicleId)
    mockVehicles.set(vehicleId, {
      ...vehicle,
      lastInspectionDate: mockBlockHeight,
      certificationExpiry,
    })
    
    return { success: true }
  },
  
  deactivateVehicle: (vehicleId) => {
    if (!mockVehicles.has(vehicleId)) {
      return { error: 404 }
    }
    
    const vehicle = mockVehicles.get(vehicleId)
    if (vehicle.owner !== mockTxSender) {
      return { error: 403 }
    }
    
    mockVehicles.set(vehicleId, {
      ...vehicle,
      active: false,
    })
    
    return { success: true }
  },
  
  getVehicleInfo: (vehicleId) => {
    return mockVehicles.get(vehicleId) || null
  },
  
  isCertificationValid: (vehicleId) => {
    const vehicle = mockVehicles.get(vehicleId)
    if (!vehicle) return false
    
    return vehicle.active && mockBlockHeight < vehicle.certificationExpiry
  },
}

describe("Vehicle Verification Contract", () => {
  beforeEach(() => {
    mockVehicles.clear()
  })
  
  it("should register a new vehicle successfully", () => {
    const result = mockContractFunctions.registerVehicle(
        "vehicle123",
        "Ambulance Type II",
        ["Stretcher", "Oxygen", "Defibrillator", "First Aid Kit"],
        mockBlockHeight + 365, // Certification valid for 365 blocks
    )
    
    expect(result.success).toBe(true)
    expect(mockVehicles.has("vehicle123")).toBe(true)
    
    const vehicleData = mockVehicles.get("vehicle123")
    expect(vehicleData.vehicleType).toBe("Ambulance Type II")
    expect(vehicleData.equipment).toContain("Defibrillator")
    expect(vehicleData.active).toBe(true)
  })
  
  it("should update vehicle equipment successfully", () => {
    mockContractFunctions.registerVehicle(
        "vehicle123",
        "Ambulance Type II",
        ["Stretcher", "Oxygen", "Defibrillator", "First Aid Kit"],
        mockBlockHeight + 365,
    )
    
    const result = mockContractFunctions.updateVehicleEquipment("vehicle123", [
      "Stretcher",
      "Oxygen",
      "Defibrillator",
      "First Aid Kit",
      "Wheelchair",
    ])
    
    expect(result.success).toBe(true)
    
    const vehicleData = mockVehicles.get("vehicle123")
    expect(vehicleData.equipment).toContain("Wheelchair")
    expect(vehicleData.lastInspectionDate).toBe(mockBlockHeight)
  })
  
  it("should record inspection successfully", () => {
    mockContractFunctions.registerVehicle(
        "vehicle123",
        "Ambulance Type II",
        ["Stretcher", "Oxygen", "Defibrillator", "First Aid Kit"],
        mockBlockHeight + 365,
    )
    
    const newExpiryDate = mockBlockHeight + 730 // Extended for 730 blocks
    const result = mockContractFunctions.recordInspection("vehicle123", newExpiryDate)
    
    expect(result.success).toBe(true)
    
    const vehicleData = mockVehicles.get("vehicle123")
    expect(vehicleData.certificationExpiry).toBe(newExpiryDate)
    expect(vehicleData.lastInspectionDate).toBe(mockBlockHeight)
  })
  
  it("should deactivate a vehicle successfully", () => {
    mockContractFunctions.registerVehicle(
        "vehicle123",
        "Ambulance Type II",
        ["Stretcher", "Oxygen", "Defibrillator", "First Aid Kit"],
        mockBlockHeight + 365,
    )
    
    const result = mockContractFunctions.deactivateVehicle("vehicle123")
    
    expect(result.success).toBe(true)
    
    const vehicleData = mockVehicles.get("vehicle123")
    expect(vehicleData.active).toBe(false)
  })
  
  it("should correctly determine if certification is valid", () => {
    mockContractFunctions.registerVehicle(
        "validVehicle",
        "Ambulance Type II",
        ["Stretcher", "Oxygen", "Defibrillator"],
        mockBlockHeight + 365,
    )
    
    mockContractFunctions.registerVehicle(
        "expiredVehicle",
        "Ambulance Type I",
        ["Stretcher", "Oxygen"],
        mockBlockHeight - 10, // Already expired
    )
    
    mockContractFunctions.registerVehicle(
        "inactiveVehicle",
        "Wheelchair Van",
        ["Wheelchair Lift", "Restraints"],
        mockBlockHeight + 365,
    )
    mockContractFunctions.deactivateVehicle("inactiveVehicle")
    
    expect(mockContractFunctions.isCertificationValid("validVehicle")).toBe(true)
    expect(mockContractFunctions.isCertificationValid("expiredVehicle")).toBe(false)
    expect(mockContractFunctions.isCertificationValid("inactiveVehicle")).toBe(false)
  })
})

