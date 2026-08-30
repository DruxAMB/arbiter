// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ArbiterAttestation
/// @notice Records CEX-DEX arbitrage opportunities attested by the Arbiter agent on Base.
contract ArbiterAttestation {
    struct Attestation {
        string pair;
        uint256 bingxPrice;
        uint256 dexPrice;
        uint256 gapBps;
        uint256 timestamp;
        address attester;
    }

    address public owner;
    uint256 public attestationCount;
    mapping(uint256 => Attestation) public attestations;

    event OpportunityAttested(
        uint256 indexed id,
        string pair,
        uint256 bingxPrice,
        uint256 dexPrice,
        uint256 gapBps,
        address indexed attester
    );

    constructor() {
        owner = msg.sender;
    }

    /// @notice Record a CEX-DEX price gap opportunity on-chain.
    /// @param pair Token pair symbol (e.g. "ETH-USDC")
    /// @param bingxPrice BingX CEX price scaled by 1e6
    /// @param dexPrice DEX price scaled by 1e6
    /// @param gapBps Price gap in basis points
    function attestOpportunity(
        string calldata pair,
        uint256 bingxPrice,
        uint256 dexPrice,
        uint256 gapBps
    ) external {
        uint256 id = attestationCount++;
        attestations[id] = Attestation({
            pair: pair,
            bingxPrice: bingxPrice,
            dexPrice: dexPrice,
            gapBps: gapBps,
            timestamp: block.timestamp,
            attester: msg.sender
        });
        emit OpportunityAttested(id, pair, bingxPrice, dexPrice, gapBps, msg.sender);
    }

    /// @notice Get total number of attestations.
    function getCount() external view returns (uint256) {
        return attestationCount;
    }

    /// @notice Get a specific attestation by ID.
    function getAttestation(uint256 id) external view returns (Attestation memory) {
        require(id < attestationCount, "Invalid attestation ID");
        return attestations[id];
    }
}
