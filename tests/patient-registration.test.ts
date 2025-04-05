import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract interactions
const mockPatients = new Map()
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockAdmin = mockTxSender

// Mock contract functions
const mockContractFunctions = {
  registerPatient: (patientId, medicalCondition, equipmentNeeds, mobilityStatus, emergencyContact) => {
    if (mockTxSender !== mockAdmin) {
      return { error: 403 }
    }
    
    if (mockPatients.has(patientId)) {
      return { error: 100 }
    }
    
    mockPatients.set(patientId, {
      owner: mockTxSender,
      medicalCondition,
      equipmentNeeds,
      mobilityStatus,
      emergencyContact,
      active: true,
    })
    
    return { success: true }
  },
  
  updatePatientInfo: (patientId, medicalCondition, equipmentNeeds, mobilityStatus, emergencyContact) => {
    if (!mockPatients.has(patientId)) {
      return { error: 404 }
    }
    
    const patient = mockPatients.get(patientId)
    if (patient.owner !== mockTxSender) {
      return { error: 403 }
    }
    
    mockPatients.set(patientId, {
      ...patient,
      medicalCondition,
      equipmentNeeds,
      mobilityStatus,
      emergencyContact,
    })
    
    return { success: true }
  },
  
  deactivatePatient: (patientId) => {
    if (!mockPatients.has(patientId)) {
      return { error: 404 }
    }
    
    const patient = mockPatients.get(patientId)
    if (patient.owner !== mockTxSender) {
      return { error: 403 }
    }
    
    mockPatients.set(patientId, {
      ...patient,
      active: false,
    })
    
    return { success: true }
  },
  
  getPatientInfo: (patientId) => {
    return mockPatients.get(patientId) || null
  },
}

describe("Patient Registration Contract", () => {
  beforeEach(() => {
    mockPatients.clear()
  })
  
  it("should register a new patient successfully", () => {
    const result = mockContractFunctions.registerPatient(
        "patient123",
        "Diabetes Type 2",
        "Wheelchair, Oxygen",
        "Limited mobility",
        "John Doe: 555-1234",
    )
    
    expect(result.success).toBe(true)
    expect(mockPatients.has("patient123")).toBe(true)
    
    const patientData = mockPatients.get("patient123")
    expect(patientData.medicalCondition).toBe("Diabetes Type 2")
    expect(patientData.active).toBe(true)
  })
  
  it("should not register a patient with duplicate ID", () => {
    mockContractFunctions.registerPatient(
        "patient123",
        "Diabetes Type 2",
        "Wheelchair, Oxygen",
        "Limited mobility",
        "John Doe: 555-1234",
    )
    
    const result = mockContractFunctions.registerPatient(
        "patient123",
        "Heart Condition",
        "None",
        "Full mobility",
        "Jane Doe: 555-5678",
    )
    
    expect(result.error).toBe(100)
  })
  
  it("should update patient information successfully", () => {
    mockContractFunctions.registerPatient(
        "patient123",
        "Diabetes Type 2",
        "Wheelchair, Oxygen",
        "Limited mobility",
        "John Doe: 555-1234",
    )
    
    const result = mockContractFunctions.updatePatientInfo(
        "patient123",
        "Diabetes Type 2 and Hypertension",
        "Wheelchair, Oxygen, Blood Pressure Monitor",
        "Limited mobility",
        "John Doe: 555-1234, Jane Doe: 555-5678",
    )
    
    expect(result.success).toBe(true)
    
    const patientData = mockPatients.get("patient123")
    expect(patientData.medicalCondition).toBe("Diabetes Type 2 and Hypertension")
    expect(patientData.equipmentNeeds).toBe("Wheelchair, Oxygen, Blood Pressure Monitor")
  })
  
  it("should deactivate a patient successfully", () => {
    mockContractFunctions.registerPatient(
        "patient123",
        "Diabetes Type 2",
        "Wheelchair, Oxygen",
        "Limited mobility",
        "John Doe: 555-1234",
    )
    
    const result = mockContractFunctions.deactivatePatient("patient123")
    
    expect(result.success).toBe(true)
    
    const patientData = mockPatients.get("patient123")
    expect(patientData.active).toBe(false)
  })
  
  it("should retrieve patient information correctly", () => {
    mockContractFunctions.registerPatient(
        "patient123",
        "Diabetes Type 2",
        "Wheelchair, Oxygen",
        "Limited mobility",
        "John Doe: 555-1234",
    )
    
    const patientInfo = mockContractFunctions.getPatientInfo("patient123")
    
    expect(patientInfo).not.toBeNull()
    expect(patientInfo.medicalCondition).toBe("Diabetes Type 2")
    expect(patientInfo.equipmentNeeds).toBe("Wheelchair, Oxygen")
    expect(patientInfo.mobilityStatus).toBe("Limited mobility")
    expect(patientInfo.emergencyContact).toBe("John Doe: 555-1234")
    expect(patientInfo.active).toBe(true)
  })
})

