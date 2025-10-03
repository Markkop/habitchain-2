
// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const HabitTrackerModule = buildModule("HabitTrackerModule", (m) => {
    // Treasury address - should be set to a proper address for production
    // For testing, you can use the deployer's address or a specific treasury address
    const treasuryAddress = m.getParameter("treasuryAddress", "0x0000000000000000000000000000000000000000")

    const habitTracker = m.contract("HabitTracker", [treasuryAddress])

    return { habitTracker }
})

export default HabitTrackerModule

