
// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const HabitTrackerModule = buildModule("HabitTrackerModule", (m) => {
    // Treasury address - defaults to deployer address for testing
    // For production, pass a proper treasury address via parameters
    const deployer = m.getAccount(0)
    const treasuryAddress = m.getParameter("treasuryAddress", deployer)

    // Staking adapter - optional, can be address(0) initially
    const stakingAdapter = m.getParameter(
        "stakingAdapter",
        "0x0000000000000000000000000000000000000000"
    )

    const habitTracker = m.contract("HabitTracker", [treasuryAddress, stakingAdapter])

    return { habitTracker }
})

export default HabitTrackerModule

