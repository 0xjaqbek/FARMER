// src/firebase/crowdfunding.js - Firebase functions for crowdfunding campaigns
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from './config';

// Helper function to safely convert dates
const safeToDate = (timestamp) => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  return new Date();
};

// Create a new campaign
export const createCampaign = async (campaignData) => {
  try {
    console.log('🔥 Creating new campaign:', campaignData.title);
    
    const campaign = {
      ...campaignData,
      status: 'draft', // draft, active, funded, expired, cancelled
      currentAmount: 0,
      backerCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      startDate: null, // Set when campaign goes live
      endDate: null,
      featured: false,
      verified: false // Admin verification for featured campaigns
    };
    
    const docRef = await addDoc(collection(db, 'campaigns'), campaign);
    
    console.log('✅ Campaign created with ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error creating campaign:', error);
    throw error;
  }
};

// Get all active campaigns
export const getActiveCampaigns = async () => {
  try {
    console.log('🔥 Fetching active campaigns...');
    
    const campaignsRef = collection(db, 'campaigns');
    const q = query(
      campaignsRef, 
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const campaigns = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      campaigns.push({
        id: doc.id,
        ...data,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate)
      });
    });
    
    console.log(`✅ Found ${campaigns.length} active campaigns`);
    return campaigns;
    
  } catch (error) {
    console.error('❌ Error fetching active campaigns:', error);
    throw error;
  }
};

// Get campaigns by farmer
export const getCampaignsByFarmer = async (farmerId) => {
  try {
    console.log('🔥 Fetching campaigns for farmer:', farmerId);
    
    const campaignsRef = collection(db, 'campaigns');
    const q = query(
      campaignsRef, 
      where('farmerId', '==', farmerId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const campaigns = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      campaigns.push({
        id: doc.id,
        ...data,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate)
      });
    });
    
    console.log(`✅ Found ${campaigns.length} campaigns for farmer ${farmerId}`);
    return campaigns;
    
  } catch (error) {
    console.error('❌ Error fetching farmer campaigns:', error);
    throw error;
  }
};

// Get campaign by ID
export const getCampaignById = async (campaignId) => {
  try {
    console.log('🔥 Fetching campaign:', campaignId);
    
    const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
    
    if (!campaignDoc.exists()) {
      throw new Error('Campaign not found');
    }
    
    const data = campaignDoc.data();
    const campaign = {
      id: campaignDoc.id,
      ...data,
      createdAt: safeToDate(data.createdAt),
      updatedAt: safeToDate(data.updatedAt),
      startDate: safeToDate(data.startDate),
      endDate: safeToDate(data.endDate)
    };
    
    console.log('✅ Campaign fetched successfully');
    return campaign;
    
  } catch (error) {
    console.error('❌ Error fetching campaign:', error);
    throw error;
  }
};

// Update campaign
export const updateCampaign = async (campaignId, updates) => {
  try {
    console.log('🔥 Updating campaign:', campaignId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'campaigns', campaignId), updateData);
    
    console.log('✅ Campaign updated successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error updating campaign:', error);
    throw error;
  }
};

// Launch campaign (change status from draft to active)
export const launchCampaign = async (campaignId, durationDays = 30) => {
  try {
    console.log('🔥 Launching campaign:', campaignId);
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationDays);
    
    await updateDoc(doc(db, 'campaigns', campaignId), {
      status: 'active',
      startDate: serverTimestamp(),
      endDate: endDate,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Campaign launched successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error launching campaign:', error);
    throw error;
  }
};

// Back a campaign
export const backCampaign = async (campaignId, backerId, amount, rewardTier = null) => {
  try {
    console.log('🔥 Processing campaign backing:', { campaignId, backerId, amount });
    
    const batch = writeBatch(db);
    
    // Create backing record
    const backingData = {
      campaignId,
      backerId,
      amount,
      rewardTier,
      status: 'confirmed', // confirmed, pending, refunded
      createdAt: serverTimestamp(),
      paymentMethod: 'pending', // Will be updated after payment processing
      deliveryAddress: null // Will be collected later
    };
    
    const backingRef = doc(collection(db, 'backings'));
    batch.set(backingRef, backingData);
    
    // Update campaign totals
    const campaignRef = doc(db, 'campaigns', campaignId);
    batch.update(campaignRef, {
      currentAmount: increment(amount),
      backerCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    // Update reward tier if applicable
    if (rewardTier) {
      const rewardRef = doc(db, 'campaigns', campaignId, 'rewards', rewardTier.id);
      batch.update(rewardRef, {
        currentBackers: increment(1)
      });
    }
    
    await batch.commit();
    
    console.log('✅ Campaign backing processed successfully');
    return backingRef.id;
    
  } catch (error) {
    console.error('❌ Error backing campaign:', error);
    throw error;
  }
};

// Get campaign backings
export const getCampaignBackings = async (campaignId) => {
  try {
    console.log('🔥 Fetching backings for campaign:', campaignId);
    
    const backingsRef = collection(db, 'backings');
    const q = query(
      backingsRef,
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const backings = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      backings.push({
        id: doc.id,
        ...data,
        createdAt: safeToDate(data.createdAt)
      });
    });
    
    console.log(`✅ Found ${backings.length} backings for campaign`);
    return backings;
    
  } catch (error) {
    console.error('❌ Error fetching campaign backings:', error);
    throw error;
  }
};

// Get user's backed campaigns
export const getUserBackedCampaigns = async (userId) => {
  try {
    console.log('🔥 Fetching backed campaigns for user:', userId);
    
    const backingsRef = collection(db, 'backings');
    const q = query(
      backingsRef,
      where('backerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const backings = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      backings.push({
        id: doc.id,
        ...data,
        createdAt: safeToDate(data.createdAt)
      });
    });
    
    // Get campaign details for each backing
    const campaignIds = [...new Set(backings.map(b => b.campaignId))];
    const campaigns = {};
    
    for (const campaignId of campaignIds) {
      try {
        campaigns[campaignId] = await getCampaignById(campaignId);
      } catch (error) {
        console.warn(`Could not fetch campaign ${campaignId}:`, error);
      }
    }
    
    const backedCampaigns = backings.map(backing => ({
      ...backing,
      campaign: campaigns[backing.campaignId]
    }));
    
    console.log(`✅ Found ${backedCampaigns.length} backed campaigns for user`);
    return backedCampaigns;
    
  } catch (error) {
    console.error('❌ Error fetching user backed campaigns:', error);
    throw error;
  }
};

// Search campaigns
export const searchCampaigns = async (searchTerm, category = null, status = 'active') => {
  try {
    console.log('🔥 Searching campaigns:', { searchTerm, category, status });
    
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - consider using Algolia for production
    
    let q = query(collection(db, 'campaigns'));
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    let campaigns = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      campaigns.push({
        id: doc.id,
        ...data,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate)
      });
    });
    
    // Client-side filtering for search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      campaigns = campaigns.filter(campaign => 
        campaign.title?.toLowerCase().includes(searchLower) ||
        campaign.description?.toLowerCase().includes(searchLower) ||
        campaign.farmName?.toLowerCase().includes(searchLower) ||
        campaign.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    console.log(`✅ Found ${campaigns.length} campaigns matching search`);
    return campaigns;
    
  } catch (error) {
    console.error('❌ Error searching campaigns:', error);
    throw error;
  }
};

// Get featured campaigns
export const getFeaturedCampaigns = async () => {
  try {
    console.log('🔥 Fetching featured campaigns...');
    
    const campaignsRef = collection(db, 'campaigns');
    const q = query(
      campaignsRef,
      where('featured', '==', true),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(6)
    );
    
    const snapshot = await getDocs(q);
    const campaigns = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      campaigns.push({
        id: doc.id,
        ...data,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        startDate: safeToDate(data.startDate),
        endDate: safeToDate(data.endDate)
      });
    });
    
    console.log(`✅ Found ${campaigns.length} featured campaigns`);
    return campaigns;
    
  } catch (error) {
    console.error('❌ Error fetching featured campaigns:', error);
    throw error;
  }
};

// Get campaign statistics
export const getCampaignStats = async () => {
  try {
    console.log('🔥 Calculating campaign statistics...');
    
    const campaignsSnapshot = await getDocs(collection(db, 'campaigns'));
    const backingsSnapshot = await getDocs(collection(db, 'backings'));
    
    let totalCampaigns = 0;
    let activeCampaigns = 0;
    let successfulCampaigns = 0;
    let totalRaised = 0;
    let totalGoal = 0;
    
    campaignsSnapshot.forEach((doc) => {
      const campaign = doc.data();
      totalCampaigns++;
      
      if (campaign.status === 'active') {
        activeCampaigns++;
      }
      
      if (campaign.currentAmount >= campaign.goalAmount) {
        successfulCampaigns++;
      }
      
      totalRaised += campaign.currentAmount || 0;
      totalGoal += campaign.goalAmount || 0;
    });
    
    const totalBackers = backingsSnapshot.size;
    const successRate = totalCampaigns > 0 ? (successfulCampaigns / totalCampaigns) * 100 : 0;
    const averageRaised = totalCampaigns > 0 ? totalRaised / totalCampaigns : 0;
    
    const stats = {
      totalCampaigns,
      activeCampaigns,
      successfulCampaigns,
      totalRaised,
      totalGoal,
      totalBackers,
      successRate: Math.round(successRate * 100) / 100,
      averageRaised: Math.round(averageRaised * 100) / 100,
      fundingRate: totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0
    };
    
    console.log('✅ Campaign statistics calculated:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ Error calculating campaign stats:', error);
    throw error;
  }
};

// Update campaign status (for scheduled tasks)
export const updateExpiredCampaigns = async () => {
  try {
    console.log('🔥 Checking for expired campaigns...');
    
    const now = new Date();
    const campaignsRef = collection(db, 'campaigns');
    const q = query(
      campaignsRef,
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let expiredCount = 0;
    
    snapshot.forEach((doc) => {
      const campaign = doc.data();
      const endDate = safeToDate(campaign.endDate);
      
      if (endDate <= now) {
        const newStatus = campaign.currentAmount >= campaign.goalAmount ? 'funded' : 'expired';
        batch.update(doc.ref, {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
        expiredCount++;
      }
    });
    
    if (expiredCount > 0) {
      await batch.commit();
      console.log(`✅ Updated ${expiredCount} expired campaigns`);
    } else {
      console.log('✅ No expired campaigns found');
    }
    
    return expiredCount;
    
  } catch (error) {
    console.error('❌ Error updating expired campaigns:', error);
    throw error;
  }
};

// Delete campaign (only drafts or by admin)
export const deleteCampaign = async (campaignId, userId, isAdmin = false) => {
  try {
    console.log('🔥 Deleting campaign:', campaignId);
    
    const campaign = await getCampaignById(campaignId);
    
    // Check permissions
    if (!isAdmin && campaign.farmerId !== userId) {
      throw new Error('Unauthorized to delete this campaign');
    }
    
    if (!isAdmin && campaign.status !== 'draft') {
      throw new Error('Can only delete draft campaigns');
    }
    
    // Check if campaign has backings
    const backings = await getCampaignBackings(campaignId);
    if (backings.length > 0 && !isAdmin) {
      throw new Error('Cannot delete campaign with existing backings');
    }
    
    await deleteDoc(doc(db, 'campaigns', campaignId));
    
    console.log('✅ Campaign deleted successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting campaign:', error);
    throw error;
  }
};