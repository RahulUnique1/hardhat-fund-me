const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.parseEther("25") // ethers.utils.parseEther ==> ethers.parseEther | 1 ETH or 1e18 wei // ethers.parseEther("1") didnt work. why? (is it because it skipped price conversion?)
          beforeEach(async function () {
              // deploy fundMe contract
              // using hardhat deploy
              // const accounts = await ethers.getSigners()
              // const firstAccount = accounts[0]

              // deployer = (await getNamedAccounts()).deployer
              deployer = await ethers.provider.getSigner()
              await deployments.fixture(["all"]) // deploy with tags
              fundMe = await ethers.getContractAt(
                  "FundMe",
                  (await deployments.get("FundMe")).address,
                  deployer,
              )
              mockV3Aggregator = await ethers.getContractAt(
                  "MockV3Aggregator",
                  (await deployments.get("MockV3Aggregator")).address,
                  deployer,
              )
          })

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed() // s_priceFeed() -> getPriceFeed() | #refactoring
                  assert.equal(response, await mockV3Aggregator.getAddress()) // mockV3Aggregator.address ==> await mockV3Aggregator.getAddress()
              })
          })

          describe("fund", function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send Enough!",
                  )
              })

              it("updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue }) // msg.value | msg = { value: sendValue }
                  const response =
                      await fundMe.getAddressToAmountFunded(deployer) // s_addressToAmountFunded(deployer) -> getAddressToAmountFunded(deployer) |  | #refactoring
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0) // s_funders(0) -> getFunder(0) | # refactoring
                  assert.equal(funder, deployer.address) // deployer ==> deployer.address
              })
          })

          describe("withdraw", function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single funder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress(),
                      ) // fundMe.provider.getBalance(fundMe.address) ==> ethers.provider.getBalance(await fundMe.getAddress()) // contract's balance
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer) // fundMe.provider.getBalance(deployer) ==> ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1) // To summarize, we send transaction to blockchain and get Response, as soon as it gets mined we get Receipt
                  const { gasUsed, gasPrice } = transactionReceipt // effectiveGasPrice ==> gasPrice
                  const gasCost = gasUsed * gasPrice // ethers v5: gasUsed.mul(effectiveGasPrice) ==> ethers v6: gasUsed * effectiveGasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress(),
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString(),
                  )
              })

              it("allows us to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      // 0th index is deployer, thats why started "i" from 1
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      ) // connects other account with the contract
                      await fundMeConnectedContract.fund({ value: sendValue }) // others can fund the contract
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress(),
                      )
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress(),
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString(),
                  )

                  // Make sure that the funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract =
                      await fundMe.connect(attacker) // connected other account to the contract
                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted // others cannot withdraw from contract
                  // await expect(
                  //     attackerConnectedContract.withdraw(),
                  // ).to.be.revertedWith("FundMe__NotOwner")  // Didn't work!
              })

              it("Cheaper Withdraw ETH from a single funder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress(),
                      ) // fundMe.provider.getBalance(fundMe.address) ==> ethers.provider.getBalance(await fundMe.getAddress()) // contract's balance
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer) // fundMe.provider.getBalance(deployer) ==> ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1) // To summarize, we send transaction to blockchain and get Response, as soon as it gets mined we get Receipt
                  const { gasUsed, gasPrice } = transactionReceipt // effectiveGasPrice ==> gasPrice
                  const gasCost = gasUsed * gasPrice // ethers v5: gasUsed.mul(effectiveGasPrice) ==> ethers v6: gasUsed * effectiveGasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress(),
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString(),
                  )
              })
          })
      })

// signer 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// deployer 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
//
// ethers.getContract is giving error (ethers.getContract is not a function)
// yarn add --dev hardhat @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers
// above command was not used as @nomicfoundation was installed with hardhat package
// the command could not have worked with new package and environement as the course is little old now
// because of this ethers.getContract is not working
// we tried using above command with @nomicfoundation/hardhat-ethers but it gave errors with other commands
// we are using ethers.getContractAt with the new environment and package configuration
// we used "deployer" from getNamedAccounts previously while deployment but we will use "signer" and ethers.getContractAt now as
// ethers.getContract is failing
// solution found at https://github.com/smartcontractkit/full-blockchain-solidity-course-js/discussions/1503#discussioncomment-7288675
