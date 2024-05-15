const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { sendEthConfig } = require("../helper-hardhat-config")

const sendEth = sendEthConfig[network.config.chainId]
async function main() {
    const deployer = await ethers.provider.getSigner()
    const fundMe = await ethers.getContractAt(
        "FundMe",
        (await deployments.get("FundMe")).address,
        deployer,
    )
    console.log("Funding Contract...")
    console.log("sendEth", sendEth)
    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther(`${sendEth}`),
    })
    await transactionResponse.wait(1)
    const fundMeBalance = await ethers.provider.getBalance(
        await fundMe.getAddress(),
    )
    console.log("Funded!")
    console.log("fundMe Balance", fundMeBalance)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
