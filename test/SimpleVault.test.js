const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleVault", function () {
  let vault, owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const SimpleVault = await ethers.getContractFactory("SimpleVault");
    vault = await SimpleVault.deploy();
    await vault.waitForDeployment();
  });

  it("sets the deployer as owner", async function () {
    expect(await vault.owner()).to.equal(owner.address);
  });

  it("lets a user deposit and tracks their balance", async function () {
    await vault.connect(alice).deposit({ value: ethers.parseEther("1") });
    expect(await vault.balanceOf(alice.address)).to.equal(ethers.parseEther("1"));
  });

  it("rejects a zero-value deposit", async function () {
    await expect(
      vault.connect(alice).deposit({ value: 0 })
    ).to.be.revertedWith("SimpleVault: deposit must be > 0");
  });

  it("lets a user withdraw up to their balance", async function () {
    await vault.connect(alice).deposit({ value: ethers.parseEther("1") });
    await expect(
      vault.connect(alice).withdraw(ethers.parseEther("1"))
    ).to.changeEtherBalance(alice, ethers.parseEther("1"));
    expect(await vault.balanceOf(alice.address)).to.equal(0);
  });

  it("reverts if a user withdraws more than their balance", async function () {
    await vault.connect(alice).deposit({ value: ethers.parseEther("1") });
    await expect(
      vault.connect(alice).withdraw(ethers.parseEther("2"))
    ).to.be.revertedWith("SimpleVault: insufficient balance");
  });

  it("does not let a non-owner sweep the contract", async function () {
    await expect(
      vault.connect(alice).sweep(bob.address)
    ).to.be.revertedWith("SimpleVault: caller is not the owner");
  });

  it("lets owner update minDeposit and maxDeposit", async function () {
    const min = ethers.parseEther("0.1");
    const max = ethers.parseEther("5");

    await expect(vault.setMinDeposit(min))
      .to.emit(vault, "MinDepositUpdated")
      .withArgs(min);
    await expect(vault.setMaxDeposit(max))
      .to.emit(vault, "MaxDepositUpdated")
      .withArgs(max);

    expect(await vault.minDeposit()).to.equal(min);
    expect(await vault.maxDeposit()).to.equal(max);
  });

  it("rejects non-owner calls to setMinDeposit and setMaxDeposit", async function () {
    await expect(
      vault.connect(alice).setMinDeposit(ethers.parseEther("0.1"))
    ).to.be.revertedWith("SimpleVault: caller is not the owner");

    await expect(
      vault.connect(alice).setMaxDeposit(ethers.parseEther("5"))
    ).to.be.revertedWith("SimpleVault: caller is not the owner");
  });

  it("prevents setting minDeposit above maxDeposit or vice versa", async function () {
    await vault.setMaxDeposit(ethers.parseEther("1"));
    await expect(
      vault.setMinDeposit(ethers.parseEther("2"))
    ).to.be.revertedWith("SimpleVault: min exceeds max");

    await vault.setMinDeposit(ethers.parseEther("1"));
    await expect(
      vault.setMaxDeposit(ethers.parseEther("0.5"))
    ).to.be.revertedWith("SimpleVault: max below min");
  });

  it("reverts deposits below minDeposit or above maxDeposit", async function () {
    await vault.setMinDeposit(ethers.parseEther("0.5"));
    await vault.setMaxDeposit(ethers.parseEther("2"));

    await expect(
      vault.connect(alice).deposit({ value: ethers.parseEther("0.49") })
    ).to.be.revertedWith("SimpleVault: below minDeposit");

    await expect(
      vault.connect(alice).deposit({ value: ethers.parseEther("2.01") })
    ).to.be.revertedWith("SimpleVault: above maxDeposit");
  });

  it("accepts deposits at the exact minDeposit and maxDeposit bounds", async function () {
    const min = ethers.parseEther("0.5");
    const max = ethers.parseEther("2");
    await vault.setMinDeposit(min);
    await vault.setMaxDeposit(max);

    await vault.connect(alice).deposit({ value: min });
    await vault.connect(alice).deposit({ value: max });

    expect(await vault.balanceOf(alice.address)).to.equal(min + max);
  });
});
