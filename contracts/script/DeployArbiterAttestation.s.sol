// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ArbiterAttestation.sol";

contract DeployArbiterAttestation is Script {
    function run() external {
        vm.startBroadcast();
        ArbiterAttestation attestation = new ArbiterAttestation();
        console.log("ArbiterAttestation deployed at:", address(attestation));
        vm.stopBroadcast();
    }
}
