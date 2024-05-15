const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          const sendValue = ethers.parseEther("0.018")
          //   const sendValue = ethers.parseEther("1")
          beforeEach(async function () {
              deployer = await ethers.provider.getSigner()
              fundMe = await ethers.getContractAt(
                  "FundMe",
                  (await deployments.get("FundMe")).address,
                  deployer,
              )
              console.log("deployer", deployer)
              console.log("fundMe", await fundMe.getAddress())
          })

          it("allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await ethers.provider.getBalance(
                  await fundMe.getAddress(),
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
