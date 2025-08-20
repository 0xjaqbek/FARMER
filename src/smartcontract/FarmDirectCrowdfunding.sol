// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title FarmDirectCrowdfunding
 * @dev Ethereum smart contract for farm-to-table crowdfunding campaigns
 * Integrates with Firebase backend for comprehensive campaign management
 */
contract FarmDirectCrowdfunding is ReentrancyGuard, Pausable, Ownable {
    using Counters for Counters.Counter;
    
    // ============ State Variables ============
    
    Counters.Counter private _campaignIds;
    
    // Platform fee (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFeeRate = 250;
    uint256 private constant BASIS_POINTS = 10000;
    
    // Minimum campaign duration (in seconds)
    uint256 public constant MIN_CAMPAIGN_DURATION = 7 days;
    uint256 public constant MAX_CAMPAIGN_DURATION = 90 days;
    
    // ============ Structs ============
    
    enum CampaignStatus {
        Draft,
        Active,
        Funded,
        Expired,
        Cancelled,
        Completed
    }
    
    enum CampaignType {
        PreOrder,
        Equipment,
        Expansion,
        Emergency
    }
    
    struct Campaign {
        uint256 id;
        string firebaseId;          // Link to Firebase document
        address farmer;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 deadline;
        uint256 createdAt;
        CampaignStatus status;
        CampaignType campaignType;
        bool verified;              // Admin verification
        bool fundsWithdrawn;
        uint256 backerCount;
        mapping(address => uint256) contributions;
        address[] backers;
    }
    
    struct Milestone {
        string description;
        uint256 amount;
        bool completed;
        uint256 completedAt;
    }
    
    struct RewardTier {
        uint256 minContribution;
        string description;
        uint256 maxBackers;
        uint256 currentBackers;
        bool isPhysical;            // Requires delivery
    }
    
    // ============ State Mappings ============
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Milestone[]) public campaignMilestones;
    mapping(uint256 => RewardTier[]) public campaignRewards;
    mapping(address => bool) public verifiedFarmers;
    mapping(address => uint256[]) public farmerCampaigns;
    mapping(address => uint256[]) public backerCampaigns;
    
    // Emergency stop for individual campaigns
    mapping(uint256 => bool) public campaignEmergencyStop;
    
    // ============ Events ============
    
    event CampaignCreated(
        uint256 indexed campaignId,
        string firebaseId,
        address indexed farmer,
        uint256 goalAmount,
        uint256 deadline,
        CampaignType campaignType
    );
    
    event ContributionMade(
        uint256 indexed campaignId,
        address indexed backer,
        uint256 amount,
        uint256 totalRaised
    );
    
    event CampaignStatusChanged(
        uint256 indexed campaignId,
        CampaignStatus oldStatus,
        CampaignStatus newStatus
    );
    
    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed farmer,
        uint256 amount,
        uint256 platformFee
    );
    
    event RefundIssued(
        uint256 indexed campaignId,
        address indexed backer,
        uint256 amount
    );
    
    event MilestoneCompleted(
        uint256 indexed campaignId,
        uint256 milestoneIndex,
        uint256 timestamp
    );
    
    event FarmerVerified(address indexed farmer, bool verified);
    event CampaignVerified(uint256 indexed campaignId, bool verified);
    
    // ============ Modifiers ============
    
    modifier onlyFarmer(uint256 _campaignId) {
        require(campaigns[_campaignId].farmer == msg.sender, "Not campaign owner");
        _;
    }
    
    modifier onlyVerifiedFarmer() {
        require(verifiedFarmers[msg.sender], "Farmer not verified");
        _;
    }
    
    modifier campaignExists(uint256 _campaignId) {
        require(_campaignId > 0 && _campaignId <= _campaignIds.current(), "Campaign does not exist");
        _;
    }
    
    modifier campaignActive(uint256 _campaignId) {
        require(campaigns[_campaignId].status == CampaignStatus.Active, "Campaign not active");
        require(block.timestamp < campaigns[_campaignId].deadline, "Campaign deadline passed");
        require(!campaignEmergencyStop[_campaignId], "Campaign emergency stopped");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        // msg.sender (deployer) becomes the contract owner
    }
    
    // ============ Campaign Management ============
    
    /**
     * @dev Create a new crowdfunding campaign
     * @param _firebaseId Firebase document ID for off-chain data
     * @param _goalAmount Target funding amount in wei
     * @param _durationDays Campaign duration in days
     * @param _campaignType Type of campaign (PreOrder, Equipment, etc.)
     */
    function createCampaign(
        string memory _firebaseId,
        uint256 _goalAmount,
        uint256 _durationDays,
        CampaignType _campaignType
    ) external onlyVerifiedFarmer whenNotPaused returns (uint256) {
        require(_goalAmount > 0, "Goal amount must be positive");
        require(
            _durationDays * 1 days >= MIN_CAMPAIGN_DURATION && 
            _durationDays * 1 days <= MAX_CAMPAIGN_DURATION,
            "Invalid campaign duration"
        );
        require(bytes(_firebaseId).length > 0, "Firebase ID required");
        
        _campaignIds.increment();
        uint256 newCampaignId = _campaignIds.current();
        
        Campaign storage newCampaign = campaigns[newCampaignId];
        newCampaign.id = newCampaignId;
        newCampaign.firebaseId = _firebaseId;
        newCampaign.farmer = msg.sender;
        newCampaign.goalAmount = _goalAmount;
        newCampaign.deadline = block.timestamp + (_durationDays * 1 days);
        newCampaign.createdAt = block.timestamp;
        newCampaign.status = CampaignStatus.Draft;
        newCampaign.campaignType = _campaignType;
        newCampaign.verified = false;
        newCampaign.fundsWithdrawn = false;
        newCampaign.backerCount = 0;
        
        farmerCampaigns[msg.sender].push(newCampaignId);
        
        emit CampaignCreated(
            newCampaignId,
            _firebaseId,
            msg.sender,
            _goalAmount,
            newCampaign.deadline,
            _campaignType
        );
        
        return newCampaignId;
    }
    
    /**
     * @dev Launch a campaign (change status from Draft to Active)
     */
    function launchCampaign(uint256 _campaignId) 
        external 
        onlyFarmer(_campaignId) 
        campaignExists(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.status == CampaignStatus.Draft, "Campaign not in draft");
        require(block.timestamp < campaign.deadline, "Campaign deadline passed");
        
        CampaignStatus oldStatus = campaign.status;
        campaign.status = CampaignStatus.Active;
        
        emit CampaignStatusChanged(_campaignId, oldStatus, CampaignStatus.Active);
    }
    
    /**
     * @dev Add milestones to a campaign
     */
    function addMilestones(
        uint256 _campaignId,
        string[] memory _descriptions,
        uint256[] memory _amounts
    ) external onlyFarmer(_campaignId) campaignExists(_campaignId) {
        require(_descriptions.length == _amounts.length, "Array length mismatch");
        require(campaigns[_campaignId].status == CampaignStatus.Draft, "Can only add milestones to draft campaigns");
        
        for (uint256 i = 0; i < _descriptions.length; i++) {
            campaignMilestones[_campaignId].push(Milestone({
                description: _descriptions[i],
                amount: _amounts[i],
                completed: false,
                completedAt: 0
            }));
        }
    }
    
    /**
     * @dev Add reward tiers to a campaign
     */
    function addRewardTiers(
        uint256 _campaignId,
        uint256[] memory _minContributions,
        string[] memory _descriptions,
        uint256[] memory _maxBackers,
        bool[] memory _isPhysical
    ) external onlyFarmer(_campaignId) campaignExists(_campaignId) {
        require(
            _minContributions.length == _descriptions.length &&
            _descriptions.length == _maxBackers.length &&
            _maxBackers.length == _isPhysical.length,
            "Array length mismatch"
        );
        require(campaigns[_campaignId].status == CampaignStatus.Draft, "Can only add rewards to draft campaigns");
        
        for (uint256 i = 0; i < _minContributions.length; i++) {
            campaignRewards[_campaignId].push(RewardTier({
                minContribution: _minContributions[i],
                description: _descriptions[i],
                maxBackers: _maxBackers[i],
                currentBackers: 0,
                isPhysical: _isPhysical[i]
            }));
        }
    }
    
    // ============ Contribution Logic ============
    
    /**
     * @dev Contribute to a campaign
     * @param _campaignId Campaign to contribute to
     * @param _rewardTierIndex Optional reward tier index (use type(uint256).max for no reward)
     */
    function contribute(uint256 _campaignId, uint256 _rewardTierIndex) 
        external 
        payable 
        campaignExists(_campaignId)
        campaignActive(_campaignId)
        nonReentrant
    {
        require(msg.value > 0, "Contribution must be positive");
        require(msg.sender != campaigns[_campaignId].farmer, "Farmers cannot back their own campaigns");
        
        // Check reward tier availability if specified
        if (_rewardTierIndex != type(uint256).max) {
            require(_rewardTierIndex < campaignRewards[_campaignId].length, "Invalid reward tier");
            RewardTier storage rewardTier = campaignRewards[_campaignId][_rewardTierIndex];
            require(msg.value >= rewardTier.minContribution, "Contribution below reward tier minimum");
            require(
                rewardTier.maxBackers == 0 || rewardTier.currentBackers < rewardTier.maxBackers,
                "Reward tier full"
            );
            rewardTier.currentBackers++;
        }
        
        // Track if this is a new backer
        bool isNewBacker = campaigns[_campaignId].contributions[msg.sender] == 0;
        
        // Update campaign state
        campaigns[_campaignId].contributions[msg.sender] += msg.value;
        campaigns[_campaignId].raisedAmount += msg.value;
        
        if (isNewBacker) {
            campaigns[_campaignId].backers.push(msg.sender);
            campaigns[_campaignId].backerCount++;
            backerCampaigns[msg.sender].push(_campaignId);
        }
        
        emit ContributionMade(_campaignId, msg.sender, msg.value, campaigns[_campaignId].raisedAmount);
        
        // Check if campaign is fully funded
        if (campaigns[_campaignId].raisedAmount >= campaigns[_campaignId].goalAmount && 
            campaigns[_campaignId].status == CampaignStatus.Active) {
            CampaignStatus oldStatus = campaigns[_campaignId].status;
            campaigns[_campaignId].status = CampaignStatus.Funded;
            emit CampaignStatusChanged(_campaignId, oldStatus, CampaignStatus.Funded);
        }
    }
    
    // ============ Fund Management ============
    
    /**
     * @dev Withdraw funds from a successful campaign
     */
    function withdrawFunds(uint256 _campaignId) 
        external 
        onlyFarmer(_campaignId)
        campaignExists(_campaignId)
        nonReentrant
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(
            campaign.status == CampaignStatus.Funded || 
            (campaign.status == CampaignStatus.Active && block.timestamp >= campaign.deadline && campaign.raisedAmount >= campaign.goalAmount),
            "Campaign not successful or funds already withdrawn"
        );
        require(!campaign.fundsWithdrawn, "Funds already withdrawn");
        require(campaign.raisedAmount > 0, "No funds to withdraw");
        
        campaign.fundsWithdrawn = true;
        
        uint256 platformFee = (campaign.raisedAmount * platformFeeRate) / BASIS_POINTS;
        uint256 farmerAmount = campaign.raisedAmount - platformFee;
        
        // Update status if campaign reached deadline
        if (campaign.status == CampaignStatus.Active) {
            CampaignStatus oldStatus = campaign.status;
            campaign.status = CampaignStatus.Funded;
            emit CampaignStatusChanged(_campaignId, oldStatus, CampaignStatus.Funded);
        }
        
        // Transfer funds
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        payable(campaign.farmer).transfer(farmerAmount);
        
        emit FundsWithdrawn(_campaignId, campaign.farmer, farmerAmount, platformFee);
    }
    
    /**
     * @dev Request refund for failed campaign
     */
    function requestRefund(uint256 _campaignId) 
        external 
        campaignExists(_campaignId)
        nonReentrant
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(
            campaign.status == CampaignStatus.Expired || 
            campaign.status == CampaignStatus.Cancelled ||
            (campaign.status == CampaignStatus.Active && block.timestamp >= campaign.deadline && campaign.raisedAmount < campaign.goalAmount),
            "Campaign not failed"
        );
        
        uint256 contribution = campaign.contributions[msg.sender];
        require(contribution > 0, "No contribution to refund");
        
        campaign.contributions[msg.sender] = 0;
        campaign.raisedAmount -= contribution;
        
        // Update status if campaign failed due to deadline
        if (campaign.status == CampaignStatus.Active && block.timestamp >= campaign.deadline) {
            CampaignStatus oldStatus = campaign.status;
            campaign.status = CampaignStatus.Expired;
            emit CampaignStatusChanged(_campaignId, oldStatus, CampaignStatus.Expired);
        }
        
        payable(msg.sender).transfer(contribution);
        
        emit RefundIssued(_campaignId, msg.sender, contribution);
    }
    
    // ============ Milestone Management ============
    
    /**
     * @dev Mark a milestone as completed (farmer only)
     */
    function completeMilestone(uint256 _campaignId, uint256 _milestoneIndex) 
        external 
        onlyFarmer(_campaignId)
        campaignExists(_campaignId)
    {
        require(_milestoneIndex < campaignMilestones[_campaignId].length, "Invalid milestone index");
        
        Milestone storage milestone = campaignMilestones[_campaignId][_milestoneIndex];
        require(!milestone.completed, "Milestone already completed");
        
        milestone.completed = true;
        milestone.completedAt = block.timestamp;
        
        emit MilestoneCompleted(_campaignId, _milestoneIndex, block.timestamp);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Verify a farmer (admin only)
     */
    function verifyFarmer(address _farmer, bool _verified) external onlyOwner {
        verifiedFarmers[_farmer] = _verified;
        emit FarmerVerified(_farmer, _verified);
    }
    
    /**
     * @dev Verify a campaign (admin only)
     */
    function verifyCampaign(uint256 _campaignId, bool _verified) 
        external 
        onlyOwner 
        campaignExists(_campaignId) 
    {
        campaigns[_campaignId].verified = _verified;
        emit CampaignVerified(_campaignId, _verified);
    }
    
    /**
     * @dev Emergency stop for specific campaign
     */
    function emergencyStopCampaign(uint256 _campaignId, bool _stopped) 
        external 
        onlyOwner 
        campaignExists(_campaignId) 
    {
        campaignEmergencyStop[_campaignId] = _stopped;
    }
    
    /**
     * @dev Cancel a campaign (admin only, for emergency situations)
     */
    function cancelCampaign(uint256 _campaignId) 
        external 
        onlyOwner 
        campaignExists(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(
            campaign.status == CampaignStatus.Draft || 
            campaign.status == CampaignStatus.Active,
            "Cannot cancel completed campaign"
        );
        
        CampaignStatus oldStatus = campaign.status;
        campaign.status = CampaignStatus.Cancelled;
        
        emit CampaignStatusChanged(_campaignId, oldStatus, CampaignStatus.Cancelled);
    }
    
    /**
     * @dev Update platform fee rate (admin only)
     */
    function setPlatformFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 1000, "Fee rate too high (max 10%)");
        platformFeeRate = _feeRate;
    }
    
    /**
     * @dev Pause all contract operations (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract operations (admin only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get basic campaign details (part 1)
     */
    function getCampaignBasic(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId)
        returns (
            uint256 id,
            string memory firebaseId,
            address farmer,
            uint256 goalAmount,
            uint256 raisedAmount,
            uint256 deadline
        ) 
    {
        Campaign storage c = campaigns[_campaignId];
        return (c.id, c.firebaseId, c.farmer, c.goalAmount, c.raisedAmount, c.deadline);
    }
    
    /**
     * @dev Get campaign status details (part 2)
     */
    function getCampaignStatus(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId)
        returns (
            uint256 createdAt,
            CampaignStatus status,
            CampaignType campaignType,
            bool verified,
            bool fundsWithdrawn,
            uint256 backerCount
        ) 
    {
        Campaign storage c = campaigns[_campaignId];
        return (c.createdAt, c.status, c.campaignType, c.verified, c.fundsWithdrawn, c.backerCount);
    }
    
    /**
     * @dev Get user's contribution to a campaign
     */
    function getUserContribution(uint256 _campaignId, address _user) 
        external 
        view 
        campaignExists(_campaignId)
        returns (uint256) 
    {
        return campaigns[_campaignId].contributions[_user];
    }
    
    /**
     * @dev Get campaign milestones
     */
    function getCampaignMilestones(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId)
        returns (Milestone[] memory) 
    {
        return campaignMilestones[_campaignId];
    }
    
    /**
     * @dev Get campaign reward tiers
     */
    function getCampaignRewards(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId)
        returns (RewardTier[] memory) 
    {
        return campaignRewards[_campaignId];
    }
    
    /**
     * @dev Get campaigns by farmer
     */
    function getFarmerCampaigns(address _farmer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return farmerCampaigns[_farmer];
    }
    
    /**
     * @dev Get campaigns backed by user
     */
    function getBackerCampaigns(address _backer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return backerCampaigns[_backer];
    }
    
    /**
     * @dev Get total number of campaigns
     */
    function getTotalCampaigns() external view returns (uint256) {
        return _campaignIds.current();
    }
    
    /**
     * @dev Get campaign backers
     */
    function getCampaignBackers(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId)
        returns (address[] memory) 
    {
        return campaigns[_campaignId].backers;
    }
    
    // ============ Emergency Functions ============
    
    /**
     * @dev Emergency withdrawal for contract owner (only for stuck funds)
     */
    function emergencyWithdraw() external onlyOwner {
        require(paused(), "Contract must be paused");
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Receive function to accept ETH deposits
     */
    receive() external payable {
        revert("Direct deposits not allowed");
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("Function not found");
    }
}