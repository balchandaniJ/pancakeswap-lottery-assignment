pragma solidity >= 0.6.0 < 0.8.0;
pragma experimental ABIEncoderV2;

interface IWinNft {



   function getTotalSupply() external view returns(uint256);

    function getNFTNumbers(
        uint256 _nftID
    ) 
        external 
        view 
        returns(uint16[] memory);

    function getOwnerOfNft(
        uint256 _nftID
    ) 
        external 
        view 
        returns(address);

    function getNftClaimStatus(
        uint256 _nftID
    ) 
        external 
        view
        returns(bool);



    function batchMint(
        address _to,
        uint256 _nftID,
        uint8 _numberOfNft,
        uint16[] calldata _numbers,
        
    )
        external
        returns(uint256[] memory);

    function claimNft(uint256 _nftId, uint256 _nftId) external returns(bool);
}