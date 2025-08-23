// src/pages/legal/PrivacyPolicy.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, Eye, Database, MessageSquare, MapPin, CreditCard, Bell, Users, Lock, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const lastUpdated = "December 2024";

  // eslint-disable-next-line no-unused-vars
  const Section = ({ icon: Icon, title, children }) => (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-green-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  const DataTable = ({ title, items }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h5 className="font-semibold mb-2">{title}</h5>
      <ul className="list-disc list-inside space-y-1 text-sm">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-gray-600">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Important Notice */}
        <Alert className="mb-8">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This Privacy Policy explains how we collect, use, and protect your personal information when you use our farm-to-customer marketplace platform. We are committed to protecting your privacy and being transparent about our data practices.
          </AlertDescription>
        </Alert>

        {/* Overview */}
        <Section icon={Eye} title="1. Overview">
          <p>
            We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our platform and tell you about your privacy rights.
          </p>
          <p>
            Our platform connects farmers directly with customers, facilitating the sale of fresh, local produce. To provide this service effectively, we need to collect and process certain personal information.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm">
              <strong>Quick Summary:</strong> We only collect data necessary to provide our services, we don't sell your personal information, and you have control over your data and privacy settings.
            </p>
          </div>
        </Section>

        {/* Information We Collect */}
        <Section icon={Database} title="2. Information We Collect">
          <div className="space-y-4">
            <h4 className="font-semibold">Personal Information You Provide</h4>
            
            <DataTable 
              title="Account Information"
              items={[
                "Name (first and last name)",
                "Email address",
                "Phone number",
                "Password (encrypted)",
                "Profile photo (optional)",
                "User role (customer or farmer)"
              ]}
            />

            <DataTable 
              title="Address and Location Data"
              items={[
                "Street address, city, postal code",
                "Delivery addresses",
                "Location coordinates (for delivery optimization)",
                "Farm location (for farmers)"
              ]}
            />

            <DataTable 
              title="Farmer-Specific Information"
              items={[
                "Farm name and description",
                "Farming methods and certifications",
                "Business registration details",
                "Product listings and inventory",
                "Delivery options and areas served"
              ]}
            />

            <DataTable 
              title="Customer Preferences"
              items={[
                "Dietary restrictions and allergies",
                "Preferred product categories",
                "Budget range preferences",
                "Order frequency patterns",
                "Delivery preferences and instructions"
              ]}
            />

            <h4 className="font-semibold mt-6">Information We Collect Automatically</h4>
            
            <DataTable 
              title="Usage Data"
              items={[
                "Pages visited and time spent",
                "Search queries and filters used",
                "Product views and interactions",
                "Order history and patterns",
                "Device information (type, browser, OS)"
              ]}
            />

            <DataTable 
              title="Communication Data"
              items={[
                "Messages between farmers and customers",
                "Order-related communications",
                "Customer service interactions",
                "Review and rating submissions"
              ]}
            />
          </div>
        </Section>

        {/* How We Use Information */}
        <Section icon={Users} title="3. How We Use Your Information">
          <div className="space-y-4">
            <h4 className="font-semibold">Core Platform Services</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Create and manage your account</li>
              <li>Process and fulfill orders</li>
              <li>Facilitate communication between farmers and customers</li>
              <li>Coordinate deliveries and pickups</li>
              <li>Provide customer support</li>
            </ul>

            <h4 className="font-semibold">Personalization and Matching</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Show relevant products based on your location and preferences</li>
              <li>Recommend farmers and products you might like</li>
              <li>Customize your dashboard and user experience</li>
              <li>Send personalized notifications and updates</li>
            </ul>

            <h4 className="font-semibold">Platform Improvement</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Analyze usage patterns to improve our services</li>
              <li>Develop new features based on user behavior</li>
              <li>Optimize search and matching algorithms</li>
              <li>Monitor platform performance and security</li>
            </ul>

            <h4 className="font-semibold">Legal and Business Purposes</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Verify farmer credentials and business information</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations and regulations</li>
              <li>Resolve disputes and enforce our terms of service</li>
            </ul>
          </div>
        </Section>

        {/* Information Sharing */}
        <Section icon={Users} title="4. How We Share Your Information">
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-800 mb-2">We DO NOT sell your personal information</p>
              <p className="text-sm text-green-700">
                We never sell, rent, or trade your personal data to third parties for marketing purposes.
              </p>
            </div>

            <h4 className="font-semibold">Information Shared Between Users</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Farmers can see:</strong> Customer name, delivery address (for orders), contact preferences</li>
              <li><strong>Customers can see:</strong> Farmer name, farm information, product details, delivery areas</li>
              <li><strong>Public profiles:</strong> Basic information you choose to make public</li>
            </ul>

            <h4 className="font-semibold">Service Providers</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Payment processors (for secure transactions)</li>
              <li>Email and SMS service providers (for notifications)</li>
              <li>Cloud hosting services (for data storage)</li>
              <li>Analytics services (for platform improvement)</li>
            </ul>

            <h4 className="font-semibold">Legal Requirements</h4>
            <p>
              We may disclose your information when required by law, such as responding to legal requests, protecting our rights, or investigating suspected illegal activities.
            </p>
          </div>
        </Section>

        {/* Location Data */}
        <Section icon={MapPin} title="5. Location Data and Delivery">
          <div className="space-y-4">
            <h4 className="font-semibold">How We Use Location Data</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Show farmers and products available in your area</li>
              <li>Calculate delivery distances and fees</li>
              <li>Optimize delivery routes for farmers</li>
              <li>Provide location-based search results</li>
            </ul>

            <h4 className="font-semibold">Location Privacy Controls</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>You can control location sharing in your privacy settings</li>
                <li>Precise location is only shared with farmers for active orders</li>
                <li>You can choose to show approximate location only in searches</li>
                <li>Location data is not used for advertising purposes</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Payment Information */}
        <Section icon={CreditCard} title="6. Payment and Financial Information">
          <div className="space-y-4">
            <h4 className="font-semibold">Payment Security</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Payment card information is processed by certified payment processors</li>
              <li>We do not store full credit card numbers on our servers</li>
              <li>All payment transactions are encrypted and secure</li>
              <li>We may store payment methods for future convenience (with your consent)</li>
            </ul>

            <h4 className="font-semibold">Transaction Records</h4>
            <p>
              We maintain records of transactions for business purposes, tax compliance, and dispute resolution. This includes order details, amounts, and transaction dates.
            </p>
          </div>
        </Section>

        {/* Communication Privacy */}
        <Section icon={MessageSquare} title="7. Messages and Communication">
          <div className="space-y-4">
            <h4 className="font-semibold">In-Platform Messaging</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Messages between users are stored securely on our platform</li>
              <li>We may review messages to prevent abuse or resolve disputes</li>
              <li>Messages are not used for advertising or marketing purposes</li>
              <li>You can delete messages from your account</li>
            </ul>

            <h4 className="font-semibold">Email and SMS Notifications</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We send transactional emails (order confirmations, updates)</li>
              <li>Marketing emails require your explicit consent</li>
              <li>You can unsubscribe from marketing communications anytime</li>
              <li>SMS notifications are opt-in only</li>
            </ul>
          </div>
        </Section>

        {/* Your Privacy Rights */}
        <Section icon={Lock} title="8. Your Privacy Rights and Controls">
          <div className="space-y-4">
            <h4 className="font-semibold">Access and Portability</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>View and download your personal data</li>
              <li>Export your order history and preferences</li>
              <li>Request copies of data we hold about you</li>
            </ul>

            <h4 className="font-semibold">Correction and Updates</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Update your profile information anytime</li>
              <li>Correct inaccurate data in your account</li>
              <li>Modify your privacy preferences</li>
            </ul>

            <h4 className="font-semibold">Deletion and Restriction</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Delete your account and associated data</li>
              <li>Request deletion of specific information</li>
              <li>Restrict how we process your data</li>
              <li>Object to certain types of data processing</li>
            </ul>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm">
                <strong>Note:</strong> Some data may be retained for legal, business, or security purposes even after account deletion, such as transaction records required for tax compliance.
              </p>
            </div>
          </div>
        </Section>

        {/* Notification Preferences */}
        <Section icon={Bell} title="9. Notification and Marketing Preferences">
          <div className="space-y-4">
            <h4 className="font-semibold">Notification Types</h4>
            
            <DataTable 
              title="Essential Notifications (Cannot be disabled)"
              items={[
                "Order confirmations and updates",
                "Payment confirmations",
                "Security alerts and account changes",
                "Legal and policy updates"
              ]}
            />

            <DataTable 
              title="Optional Notifications (Can be controlled)"
              items={[
                "New product alerts from favorite farmers",
                "Marketing emails and promotions",
                "Newsletter and farming tips",
                "Low stock alerts (for farmers)",
                "Review and rating reminders"
              ]}
            />

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm">
                <strong>Marketing Consent:</strong> We only send marketing communications to users who have explicitly opted in. You can withdraw consent anytime through your account settings or by clicking unsubscribe.
              </p>
            </div>
          </div>
        </Section>

        {/* Data Security */}
        <Section icon={Shield} title="10. Data Security and Retention">
          <div className="space-y-4">
            <h4 className="font-semibold">Security Measures</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Data encryption in transit and at rest</li>
              <li>Secure cloud infrastructure with regular security audits</li>
              <li>Access controls and authentication requirements</li>
              <li>Regular security updates and monitoring</li>
              <li>Employee training on data protection</li>
            </ul>

            <h4 className="font-semibold">Data Retention</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold mb-2">Active Accounts</h5>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Profile data: Until account deletion</li>
                  <li>Order history: 7 years (tax purposes)</li>
                  <li>Messages: Until user deletion</li>
                  <li>Usage data: 2 years</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold mb-2">Inactive Accounts</h5>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Account data: 3 years of inactivity</li>
                  <li>Marketing data: Immediate deletion</li>
                  <li>Legal records: As required by law</li>
                  <li>Analytics data: Anonymized after 2 years</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* Children's Privacy */}
        <Section icon={Shield} title="11. Children's Privacy">
          <div className="space-y-3">
            <p>
              Our platform is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
            </p>
            <p>
              If you are a parent or guardian and believe your child has provided personal information to us, please contact us immediately. We will delete such information from our records.
            </p>
          </div>
        </Section>

        {/* International Users */}
        <Section icon={Users} title="12. International Users and Data Transfers">
          <div className="space-y-3">
            <p>
              If you access our platform from outside [Your Country], please note that your information may be transferred to, stored, and processed in [Your Country] where our servers are located.
            </p>
            <p>
              By using our platform, you consent to the transfer of your information to [Your Country] and processing in accordance with this privacy policy.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm">
                <strong>EU Users:</strong> If you are in the European Union, we comply with GDPR requirements and provide additional protections for your personal data.
              </p>
            </div>
          </div>
        </Section>

        {/* Changes to Policy */}
        <Section icon={Bell} title="13. Changes to This Privacy Policy">
          <div className="space-y-3">
            <p>
              We may update this privacy policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.
            </p>
            
            <h4 className="font-semibold">How We Notify You</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Email notification for significant changes</li>
              <li>In-app notifications when you next visit</li>
              <li>Updates posted on this page with new effective date</li>
            </ul>

            <p>
              Your continued use of the platform after changes become effective constitutes acceptance of the updated privacy policy.
            </p>
          </div>
        </Section>

        {/* Contact Information */}
        <Section icon={Mail} title="14. Contact Us">
          <div className="space-y-3">
            <p>
              If you have questions, concerns, or requests regarding this privacy policy or our data practices, please contact us:
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-2">Privacy Contact Information</h5>
              <ul className="space-y-1 text-sm">
                <li><strong>Email:</strong> privacy@yourplatform.com</li>
                <li><strong>Data Protection Officer:</strong> dpo@yourplatform.com</li>
                <li><strong>Address:</strong> [Your Business Address]</li>
                <li><strong>Phone:</strong> [Your Contact Number]</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm">
                <strong>Response Time:</strong> We aim to respond to privacy-related inquiries within 30 days. For urgent privacy concerns, please mark your email as "Urgent Privacy Request."
              </p>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <Separator className="my-8" />
        <div className="text-center text-sm text-gray-600">
          <p>
            This privacy policy is effective as of {lastUpdated} and applies to all information collected by our platform.
          </p>
          <p className="mt-2">
            By using our platform, you acknowledge that you have read and understood this privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;