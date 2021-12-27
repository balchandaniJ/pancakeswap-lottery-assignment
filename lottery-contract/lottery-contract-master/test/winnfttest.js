const { expect, assert } = require("chai");
const { network } = require("hardhat");
const { 
    lotto,
    lottoNFT,
    BigNumber,
    generateLottoNumbers
} = require("./settings.js");

describe("Lottery contract", function() {
    let mock_erc20Contract;

    let lotteryInstance, lotteryContract;

    let lotteryNftInstance, lotteryNftContract;

    let cakeInstance;

    let timerInstance, timerContract;

    let randGenInstance, randGenContract;
  
    let linkInstance;
    let mock_vrfCoordInstance, mock_vrfCoordContract;
    
    let owner, buyer;

    beforeEach(async () => {
        
        const signers = await ethers.getSigners();
        
        owner = signers[0];
        buyer = signers[1];

        
        lotteryContract = await ethers.getContractFactory("Lottery");
        
        lotteryNftContract = await ethers.getContractFactory("LotteryNFT");
        
        mock_erc20Contract = await ethers.getContractFactory("Mock_erc20");
        
        timerContract = await ethers.getContractFactory("Timer");
        
        randGenContract = await ethers.getContractFactory("RandomNumberGenerator");
        mock_vrfCoordContract = await ethers.getContractFactory("Mock_VRFCoordinator");

        
        timerInstance = await timerContract.deploy();
        cakeInstance = await mock_erc20Contract.deploy(
            lotto.buy.cake,
        );
        linkInstance = await mock_erc20Contract.deploy(
            lotto.buy.cake,
        );
        mock_vrfCoordInstance = await mock_vrfCoordContract.deploy(
            linkInstance.address,
            lotto.chainLink.keyHash,
            lotto.chainLink.fee
        );
        lotteryInstance = await lotteryContract.deploy(
            cakeInstance.address,
            timerInstance.address,
            lotto.setup.sizeOfLottery,
            lotto.setup.maxValidRange,
            lotto.setup.bucket.one,
            lotto.setup.bucket.two,
            lotto.setup.bucketDiscount.one,
            lotto.setup.bucketDiscount.two,
            lotto.setup.bucketDiscount.three
        );
        randGenInstance = await randGenContract.deploy(
            mock_vrfCoordInstance.address,
            linkInstance.address,
            lotteryInstance.address,
            lotto.chainLink.keyHash,
            lotto.chainLink.fee
        );
        lotteryNftInstance = await lotteryNftContract.deploy(
            lottoNFT.newLottoNft.uri,
            lotteryInstance.address,
            timerInstance.address
        );
        await lotteryInstance.initialize(
            lotteryNftInstance.address,
            randGenInstance.address
        );
        
        await cakeInstance.mint(
            lotteryInstance.address,
            lotto.newLotto.prize
        );
        
        await linkInstance.transfer(
            randGenInstance.address,
            lotto.buy.cake
        );
    });
// Winning lottery numbers
    it("Setting winning numbers", async function() {
        let lotteryInfoBefore = await lotteryInstance.getBasicLottoInfo(1);
       
        let currentTime = await lotteryInstance.getCurrentTime();
        
        let timeStamp = new BigNumber(currentTime.toString());
        
        let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
        
        await lotteryInstance.setCurrentTime(futureTime.toString());
        
        let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
            1,
            1234
        )).wait();
        
        let requestId = tx.events[0].args.requestId.toString();
         
        await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
            requestId,
            lotto.draw.random,
            randGenInstance.address
        );
        
        let lotteryInfoAfter = await lotteryInstance.getBasicLottoInfo(1);
        
        assert.equal(
            lotteryInfoBefore.winningNumbers.toString(),
            lotto.newLotto.win.blankWinningNumbers,
            "Winning numbers set before call"
        );
        assert.equal(
            lotteryInfoAfter.winningNumbers.toString(),
            lotto.newLotto.win.winningNumbers,
            "Winning numbers incorrect after"
        );
    });

// winning nft when 4 number matches

it("Claiming winning numbers (4 (all) match)", async function() {
    
    let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
        1,
        1
    );
    
    await cakeInstance.connect(owner).transfer(
        buyer.address,
        prices[2]
    );
    
    await cakeInstance.connect(buyer).approve(
        lotteryInstance.address,
        prices[2]
    );
    await lotteryInstance.connect(buyer).batchBuyLottoTicket(
        1,
        1,
        lotto.newLotto.win.winningNumbersArr
    );
    
    let currentTime = await lotteryInstance.getCurrentTime();
    
    let timeStamp = new BigNumber(currentTime.toString());
    
    let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
    
    await lotteryInstance.setCurrentTime(futureTime.toString());
    
    let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
    
    let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
        1,
        1234
    )).wait();
    
    let requestId = tx.events[0].args.requestId.toString();
 
    await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
        requestId,
        lotto.draw.random,
        randGenInstance.address
    );
    let buyerCakeBalanceBefore = await cakeInstance.balanceOf(buyer.address);


    currentTime = await lotteryInstance.getCurrentTime();
    
    timeStamp = new BigNumber(currentTime.toString());
    let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
    
    await lotteryInstance.setCurrentTime(futureEndTime.toString());
    
    await lotteryInstance.connect(buyer).claimReward(
        1,
        userTicketIds[50].toString()
    );
    let buyerCakeBalanceAfter = await cakeInstance.balanceOf(buyer.address);
    
    assert.equal(
        buyerCakeBalanceBefore.toString(),
        0,
        "Buyer has cake balance before claiming"
    );
    assert.equal(
        buyerCakeBalanceAfter.toString(),
        lotto.newLotto.win.match_all.toString(),
        "User won incorrect"
    );
});