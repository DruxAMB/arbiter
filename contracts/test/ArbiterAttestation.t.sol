// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ArbiterAttestation.sol";

contract ArbiterAttestationTest is Test {
    ArbiterAttestation public attestation;

    function setUp() public {
        attestation = new ArbiterAttestation();
    }

    function testConstructorSetsOwner() public {
        assertEq(attestation.owner(), address(this));
    }

    function testAttestOpportunity() public {
        attestation.attestOpportunity("ETH-USDC", 2452000000, 2453000000, 40);
        assertEq(attestation.attestationCount(), 1);

        ArbiterAttestation.Attestation memory a = attestation.getAttestation(0);
        assertEq(a.pair, "ETH-USDC");
        assertEq(a.bingxPrice, 2452000000);
        assertEq(a.dexPrice, 2453000000);
        assertEq(a.gapBps, 40);
        assertEq(a.attester, address(this));
        assertGt(a.timestamp, 0);
    }

    function testMultipleAttestations() public {
        attestation.attestOpportunity("ETH-USDC", 2452000000, 2453000000, 40);
        attestation.attestOpportunity("ETH-USDT", 2451000000, 2455000000, 163);

        assertEq(attestation.attestationCount(), 2);
        assertEq(attestation.getCount(), 2);

        ArbiterAttestation.Attestation memory a1 = attestation.getAttestation(0);
        assertEq(a1.pair, "ETH-USDC");

        ArbiterAttestation.Attestation memory a2 = attestation.getAttestation(1);
        assertEq(a2.pair, "ETH-USDT");
    }

    function testRevertInvalidId() public {
        vm.expectRevert("Invalid attestation ID");
        attestation.getAttestation(999);
    }

    function testEmitEvent() public {
        vm.expectEmit(true, true, false, true);
        emit ArbiterAttestation.OpportunityAttested(0, "ETH-USDC", 2452000000, 2453000000, 40, address(this));
        attestation.attestOpportunity("ETH-USDC", 2452000000, 2453000000, 40);
    }
}
