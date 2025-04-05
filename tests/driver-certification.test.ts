import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract interactions
const mockDrivers = new Map()
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockAdmin = mockTxSender
const mockBlockHeight = 100

// Mock contract functions
const mockContractFunctions = {
  registerDriver: (driverId, name, certifications, certificationExpiry) => {
    if (mockTxSender !== mockAdmin) {
      return { error: 403 }
    }
    
    if (mockDrivers.has(driverId)) {
      return { error: 100 }
    }
    
    mockDrivers.set(driverId, {
      principal: mockTxSender,
      name,
      certifications,
      trainingCompletion: mockBlockHeight,
      certificationExpiry,
      active: true,
    })
    
    return { success: true }
  },
  
  updateDriverCertifications: (driverId, certifications, certificationExpiry) => {
    if (!mockDrivers.has(driverId)) {
      return { error: 404 }
    }
    
    if (mockTxSender !== mockAdmin) {
      return { error: 403 }
    }
    
    const driver = mockDrivers.get(driverId)
    mockDrivers.set(driverId, {
      ...driver,
      certifications,
      trainingCompletion: mockBlockHeight,
      certificationExpiry,
    })
    
    return { success: true }
  },
  
  deactivateDriver: (driverId) => {
    if (!mockDrivers.has(driverId)) {
      return { error: 404 }
    }
    
    const driver = mockDrivers.get(driverId)
    if (driver.principal !== mockTxSender && mockTxSender !== mockAdmin) {
      return { error: 403 }
    }
    
    mockDrivers.set(driverId, {
      ...driver,
      active: false,
    })
    
    return { success: true }
  },
  
  getDriverInfo: (driverId) => {
    return mockDrivers.get(driverId) || null
  },
  
  isCertificationValid: (driverId) => {
    const driver = mockDrivers.get(driverId)
    if (!driver) return false
    
    return driver.active && mockBlockHeight < driver.certificationExpiry
  },
}

describe("Driver Certification Contract", () => {
  beforeEach(() => {
    mockDrivers.clear()
  })
  
  it("should register a new driver successfully", () => {
    const result = mockContractFunctions.registerDriver(
        "driver123",
        "John Smith",
        ["CPR", "First Aid", "Medical Transport", "Emergency Response"],
        mockBlockHeight + 365, // Certification valid for 365 blocks
    )
    
    expect(result.success).toBe(true)
    expect(mockDrivers.has("driver123")).toBe(true)
    
    const driverData = mockDrivers.get("driver123")
    expect(driverData.name).toBe("John Smith")
    expect(driverData.certifications).toContain("CPR")
    expect(driverData.active).toBe(true)
  })
  
  it("should update driver certifications successfully", () => {
    mockContractFunctions.registerDriver(
        "driver123",
        "John Smith",
        ["CPR", "First Aid", "Medical Transport"],
        mockBlockHeight + 365,
    )
    
    const result = mockContractFunctions.updateDriverCertifications(
        "driver123",
        ["CPR", "First Aid", "Medical Transport", "Advanced Life Support"],
        mockBlockHeight + 730, // Extended for 730 blocks
    )
    
    expect(result.success).toBe(true)
    
    const driverData = mockDrivers.get("driver123")
    expect(driverData.certifications).toContain("Advanced Life Support")
    expect(driverData.certificationExpiry).toBe(mockBlockHeight + 730)
  })
  
  it("should deactivate a driver successfully", () => {
    mockContractFunctions.registerDriver(
        "driver123",
        "John Smith",
        ["CPR", "First Aid", "Medical Transport"],
        mockBlockHeight + 365,
    )
    
    const result = mockContractFunctions.deactivateDriver("driver123")
    
    expect(result.success).toBe(true)
    
    const driverData = mockDrivers.get("driver123")
    expect(driverData.active).toBe(false)
  })
  
  it("should correctly determine if certification is valid", () => {
    mockContractFunctions.registerDriver(
        "validDriver",
        "John Smith",
        ["CPR", "First Aid", "Medical Transport"],
        mockBlockHeight + 365,
    )
    
    mockContractFunctions.registerDriver(
        "expiredDriver",
        "Jane Doe",
        ["CPR", "First Aid"],
        mockBlockHeight - 10, // Already expired
    )
    
    mockContractFunctions.registerDriver(
        "inactiveDriver",
        "Bob Johnson",
        ["CPR", "Medical Transport"],
        mockBlockHeight + 365,
    )
    mockContractFunctions.deactivateDriver("inactiveDriver")
    
    expect(mockContractFunctions.isCertificationValid("validDriver")).toBe(true)
    expect(mockContractFunctions.isCertificationValid("expiredDriver")).toBe(false)
    expect(mockContractFunctions.isCertificationValid("inactiveDriver")).toBe(false)
  })
})

