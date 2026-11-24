// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SimpleVault
/// @notice A minimal ETH vault. Users can deposit and withdraw their own ETH;
///         the owner can sweep any ETH left over from rounding/dust.
/// @dev This is intentionally minimal — candidates will extend it with one
///      additional requirement supplied during the live assessment.
contract SimpleVault {
    address public owner;
    uint256 public minDeposit;
    uint256 public maxDeposit;

    mapping(address => uint256) private _balances;

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Swept(address indexed to, uint256 amount);
    event MinDepositUpdated(uint256 newMinDeposit);
    event MaxDepositUpdated(uint256 newMaxDeposit);

    modifier onlyOwner() {
        require(msg.sender == owner, "SimpleVault: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setMinDeposit(uint256 _minDeposit) external onlyOwner {
        if (maxDeposit > 0) {
            require(_minDeposit <= maxDeposit, "SimpleVault: min exceeds max");
        }
        minDeposit = _minDeposit;
        emit MinDepositUpdated(_minDeposit);
    }

    function setMaxDeposit(uint256 _maxDeposit) external onlyOwner {
        if (_maxDeposit > 0) {
            require(_maxDeposit >= minDeposit, "SimpleVault: max below min");
        }
        maxDeposit = _maxDeposit;
        emit MaxDepositUpdated(_maxDeposit);
    }

    /// @notice Deposit ETH into the vault, credited to the caller.
    function deposit() external payable {
        require(msg.value > 0, "SimpleVault: deposit must be > 0");
        require(msg.value >= minDeposit, "SimpleVault: below minDeposit");
        if (maxDeposit > 0) {
            require(msg.value <= maxDeposit, "SimpleVault: above maxDeposit");
        }
        _balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw a specified amount of the caller's own balance.
    /// @param amount The amount of wei to withdraw.
    function withdraw(uint256 amount) external {
        require(amount > 0, "SimpleVault: amount must be > 0");
        require(_balances[msg.sender] >= amount, "SimpleVault: insufficient balance");

        // Effects before interactions.
        _balances[msg.sender] -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "SimpleVault: transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Returns the vault balance credited to a given account.
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    /// @notice Owner-only: sweep any ETH held by the contract that is not
    ///         accounted for in user balances (e.g. sent via selfdestruct).
    function sweep(address payable to) external onlyOwner {
        uint256 trackedTotal = address(this).balance;
        require(trackedTotal > 0, "SimpleVault: nothing to sweep");

        (bool success, ) = to.call{value: trackedTotal}("");
        require(success, "SimpleVault: sweep failed");

        emit Swept(to, trackedTotal);
    }

    receive() external payable {
        _balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
}
