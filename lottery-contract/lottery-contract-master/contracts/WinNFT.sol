
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./IWinNFT.sol";
import "./Testable.sol";


contract WinNFT is ERC721, Ownable, Testable {
    
    address internal nftContract_;

    uint256 internal totalSupply_;
 
    struct NftInfo {
        address owner;
        uint16[] numbers;
        bool claimed;
        uint256 nftId;
    }
 
    mapping(uint256 => NftInfo) internal nftInfo_;
    

    event InfoBatchMint(
        address indexed receiving, 
        uint256 nftId,
        uint256 amountOfTokens, 
        uint256[] tokenIds
    );


     @notice  
    
    modifier onlyLotto() {
        require(
            msg.sender == nftContract_,
            "Only Winners can mint"
        );
        _;
    }


    /**
     * @param   _uri A dynamic URI that enables individuals to view information
     *          around their NFT token. To see the information replace the 
     *          `\{id\}` substring with the actual token type ID. For more info
     *          visit:
     *          https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     * @param   _lotto The address of the lotto contract. The lotto contract has
     *          elevated permissions on this contract. 
     */
    constructor(
        string memory _uri,
        address _lotto,
        address _timer
    ) 
    ERC721(_uri)
    Testable(_timer)
    {
        lotteryContract_ = _lotto;
    }


    function getTotalSupply() external view returns(uint256) {
        return totalSupply_;
    }

    /**
     * @param   _nftID: The unique ID of the nft
     * @return  uint32[]: The chosen numbers for that nft
     */
    function getNftNumbers(
        uint256 _nftID
    ) 
        external 
        view 
        returns(uint16[] memory) 
    {
        return nftInfo_[_nftID].numbers;
    }

    /**
     * @param   _nftID: The unique ID of the nft
     * @return  address: Owner of nft
     */
    function getOwnerOfNft(
        uint256 _nftID
    ) 
        external 
        view 
        returns(address) 
    {
        return nftInfo_[_nftID].owner;
    }

    function getNftClaimStatus(
        uint256 _nftID
    ) 
        external 
        view
        returns(bool) 
    {
        return nftInfo_[_nftID].claimed;
    }


    /**
     * @param   _to The address being minted to
     * @param   _numberOfNft The number of NFT's to mint
     * @notice  Only the lotto contract is able to mint tokens. 
        // uint8[][] calldata _lottoNumbers
     */
    function batchMint(
        address _to,
        uint256 _lotteryId,
        uint8 _numberOfNft,
        uint16[] calldata _numbers,
        uint8 sizeOfLottery
    )
        external
        onlyLotto()
        returns(uint256[] memory)
    {
        uint256[] memory amounts = new uint256[](_numberOfNfts);
        
        _mintBatch(
            _to,
            tokenIds,
            amounts,
            msg.data
        );
        
        emit InfoBatchMint(
            _to, 
            _lotteryId,
            _numberOfNfts, 
            tokenIds
        ); 
    
        return nftIds;
    }

    function claimNft(uint256 _nftID, uint256 _lotteryId) external onlyLotto() returns(bool) {
        require(
            nftInfo_[_nftID].claimed == false,
            "Nft already claimed"
        );
        require(
            nftInfo_[_nftID].lotteryId == _lotteryId,
            "Nft not for this lottery"
        );

        nftInfo_[_nftID].claimed = true;
        return true;
    }


}