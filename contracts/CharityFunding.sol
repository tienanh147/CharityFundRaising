//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Project.sol";

contract CharityFunding {
    // [X] Anyone can start a funding project .
    // [X] Get All project list
    // [X]  contribute amount

    event ProjectStarted(
        address projectContractAddress,
        address projectStarter,
        uint256 minContribution,
        uint256 projectDeadline,
        uint256 goalAmount,
        uint256 currentAmount,
        uint256 noOfContributors,
        string title,
        string desc,
        uint256 currentState
    );

    event ContributionReceived(
        address projectAddress,
        uint256 contributedAmount,
        address indexed contributor
    );
    mapping(address => address[]) public projectsContributedOfAccount;
    mapping(address => mapping(address => uint256))
        public contributorProjectAmount;
    Project[] private projects;

    // @dev Anyone can start a fund rising
    // @return null

    function createProject(
        uint256 minimumContribution,
        uint256 deadline,
        uint256 targetContribution,
        string memory projectTitle,
        string memory projectDesc
    ) public {
        deadline = deadline;

        Project newProject = new Project(
            msg.sender,
            minimumContribution,
            deadline,
            targetContribution,
            projectTitle,
            projectDesc
        );
        projects.push(newProject);

        emit ProjectStarted(
            address(newProject),
            msg.sender,
            minimumContribution,
            deadline,
            targetContribution,
            0,
            0,
            projectTitle,
            projectDesc,
            0
        );
    }

    // @dev Get projects list
    // @return array

    function returnAllProjects() external view returns (Project[] memory) {
        return projects;
    }

    // function getProjectAddressFilter(address _creator) external view returns (address[] memory) {
    //     address[] memory projectAddressList;
    //     for(uint256 i = 0; i < projects.length; i ++) {
    //         if (projects[i].creator.address == _creator) projectAddressList[i] = address(projects[i]);
    //     }
    //     return projectAddressList;
    // }

    // @dev User can contribute
    // @return null

    function contribute(address _projectAddress) public payable {
        // uint256 minContributionAmount = Project(_projectAddress)
        // .minimumContribution();
        // Project.State projectState = Project(_projectAddress).state();
        // require(projectState == Project.State.Fundraising, "Invalid state");
        // require(
        //     msg.value >= minContributionAmount,
        //     "Contribution amount is too low !"
        // );
        // Call function
        Project(_projectAddress).contribute{value: msg.value}(msg.sender);
        //  if (contributiors[msg.sender] == 0) {
        // contributiorAddresses[noOfContributers] = _contributor;
        // noOfContributers++;
        // }
        bool contributedInThisProject = false;
        for (
            uint256 i = 0;
            i < projectsContributedOfAccount[msg.sender].length;
            i++
        ) {
            if (projectsContributedOfAccount[msg.sender][i] == _projectAddress) {
                contributedInThisProject = true;
                break;
            }
        }
        if (!contributedInThisProject)
            projectsContributedOfAccount[msg.sender].push(_projectAddress);
        contributorProjectAmount[msg.sender][_projectAddress] += msg.value;
        // Trigger event
        emit ContributionReceived(_projectAddress, msg.value, msg.sender);
    }
}
