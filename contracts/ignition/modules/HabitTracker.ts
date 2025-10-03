
// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const HabitTrackerModule = buildModule("HabitTrackerModule", (m) => {
    // Treasury address - defaults to deployer address for testing
    // For production, pass a proper treasury address via parameters
    const deployer = m.getAccount(0)
    const treasuryAddress = m.getParameter("treasuryAddress", deployer)

    const habitTracker = m.contract("HabitTracker", [treasuryAddress])

    return { habitTracker }
})

export default HabitTrackerModule

