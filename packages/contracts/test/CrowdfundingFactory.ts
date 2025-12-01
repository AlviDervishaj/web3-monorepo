import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("CrowdfundingFactory governance", async () => {
  const { viem, provider } = await network.connect();
  const [factoryOwner, creator, backer] = await viem.getWalletClients();

  const deployCampaign = async () => {
    const factory = await viem.deployContract(
      "CrowdfundingFactory",
      [],
      {
      account: factoryOwner.account,
      },
    );

    await factory.write.createCampaign(
      ["Save the Whales", "Ocean friendly", 1_000000000000000000n, 30n],
      { account: creator.account }
    );

    const campaigns = await factory.read.getAllCampaigns();
    const campaignAddress = campaigns[0].campaignAddress;
    const campaign = await viem.getContractAt("Crowdfunding", campaignAddress);

    return { factory, campaign, campaignAddress };
  };

  it("allows factory owner to pause or resume campaigns", async () => {
    const { factory, campaign, campaignAddress } = await deployCampaign();

    await factory.write.setCampaignPause([campaignAddress, true], {
      account: factoryOwner.account,
    });
    assert.equal(await campaign.read.paused(), true);

    await assert.rejects(
      factory.write.setCampaignPause([campaignAddress, false], {
        account: creator.account,
      }),
      /Not owner/
    );

    await factory.write.setCampaignPause([campaignAddress, false], {
      account: factoryOwner.account,
    });
    assert.equal(await campaign.read.paused(), false);
  });

  it("blocks funding when campaign is under review", async () => {
    const { factory, campaign, campaignAddress } = await deployCampaign();

    await campaign.write.addTier(["Bronze", 1000000000000000000n], {
      account: creator.account,
    });

    await factory.write.setCampaignUnderReview([campaignAddress, true], {
      account: factoryOwner.account,
    });

    await assert.rejects(
      campaign.write.fund([0n], {
        account: backer.account,
        value: 1000000000000000000n,
      }),
      /Campaign under review/
    );
  });

  it("requires withdrawal request, approval, and delay", async () => {
    const { factory, campaign, campaignAddress } = await deployCampaign();

    await campaign.write.addTier(["Gold", 1000000000000000000n], {
      account: creator.account,
    });

    // Reach goal immediately
    await campaign.write.fund([0n], {
      account: backer.account,
      value: 1000000000000000000n,
    });

    await campaign.write.requestWithdrawal({ account: creator.account });

    await assert.rejects(
      campaign.write.withdraw({ account: creator.account }),
      /Withdrawal delay not met/
    );

    await factory.write.approveCampaignWithdrawal([campaignAddress], {
      account: factoryOwner.account,
    });

    await provider.send("evm_increaseTime", [60 * 60 * 24]);
    await provider.send("evm_mine");

    await campaign.write.withdraw({ account: creator.account });
    assert.equal(await campaign.read.getContractBalance(), 0n);
  });
});

