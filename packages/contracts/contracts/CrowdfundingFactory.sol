// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Crowdfunding} from "./Crowdfunding.sol";

contract CrowdfundingFactory {
    address public owner;
    bool public paused;
    mapping(address => bool) public campaignPaused;
    mapping(address => bool) public campaignUnderReview;
    mapping(address => uint256) public campaignLastWithdrawalApproval;

    struct Campaign {
        address campaignAddress;
        address owner;
        string name;
        uint256 creationTime;
    }

    Campaign[] public campaigns;
    mapping(address => Campaign[]) public userCampaigns;

    event CampaignPaused(address indexed campaign, bool isPaused);
    event CampaignUnderReview(address indexed campaign, bool underReview);
    event CampaignWithdrawalApproved(address indexed campaign, uint256 approvedAt);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner.");
        _;
    }

    modifier notPaused() {
        require(!paused, "Factory is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createCampaign(
        string memory _name,
        string memory _description,
        uint256 _goal,
        uint256 _durationInDays
    ) external notPaused {
        Crowdfunding newCampaign = new Crowdfunding(
            msg.sender,
            _name,
            _description,
            _goal,
            _durationInDays
        );
        address campaignAddress = address(newCampaign);

        Campaign memory campaign = Campaign({
            campaignAddress: campaignAddress,
            owner: msg.sender,
            name: _name,
            creationTime: block.timestamp
        });

        campaigns.push(campaign);
        userCampaigns[msg.sender].push(campaign);
    }

    function getUserCampaigns(address _user) external view returns (Campaign[] memory) {
        return userCampaigns[_user];
    }

    function getAllCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }

    function togglePause() external onlyOwner {
        paused = !paused;
    }

    function setCampaignPause(address _campaign, bool _shouldPause) external onlyOwner {
        require(_campaign != address(0), "Invalid campaign");
        Crowdfunding(_campaign).setPauseFromFactory(_shouldPause);
        campaignPaused[_campaign] = _shouldPause;
        emit CampaignPaused(_campaign, _shouldPause);
    }

    function setCampaignUnderReview(address _campaign, bool _underReview) external onlyOwner {
        require(_campaign != address(0), "Invalid campaign");
        Crowdfunding(_campaign).setUnderReview(_underReview);
        campaignUnderReview[_campaign] = _underReview;
        emit CampaignUnderReview(_campaign, _underReview);
    }

    function approveCampaignWithdrawal(address _campaign) external onlyOwner {
        require(_campaign != address(0), "Invalid campaign");
        Crowdfunding(_campaign).factoryApproveWithdrawal();
        campaignLastWithdrawalApproval[_campaign] = block.timestamp;
        emit CampaignWithdrawalApproved(_campaign, block.timestamp);
    }

    function getCampaignGovernance(
        address _campaign
    )
        external
        view
        returns (
            bool isPaused,
            bool isUnderReview,
            uint256 lastWithdrawalApproval
        )
    {
        return (
            campaignPaused[_campaign],
            campaignUnderReview[_campaign],
            campaignLastWithdrawalApproval[_campaign]
        );
    }
}