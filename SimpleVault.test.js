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

  // Candidate: add tests here for the additional requirement you implement.
});
