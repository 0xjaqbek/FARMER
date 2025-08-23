// src/pages/legal/TermsOfService.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Shield, Users, CreditCard, Truck, MessageSquare, Gavel, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-gray-600">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Important Notice */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please read these Terms of Service carefully before using our platform. By creating an account or using our services, you agree to be bound by these terms.
          </AlertDescription>
        </Alert>

        {/* Agreement to Terms */}
        <Section icon={Gavel} title="1. Agreement to Terms">
          <p>
            By accessing and using this farm-to-customer marketplace platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
          </p>
          <p>
            If you do not agree to abide by the above, please do not use this service.
          </p>
          <p>
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service constitutes acceptance of any modifications.
          </p>
        </Section>

        {/* User Accounts */}
        <Section icon={Users} title="2. User Accounts and Responsibilities">
          <div className="space-y-3">
            <h4 className="font-semibold">Account Creation</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 18 years old to create an account</li>
              <li>One account per person or business entity</li>
            </ul>

            <h4 className="font-semibold">User Types</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Customers:</strong> Can browse products, place orders, communicate with farmers, and leave reviews.</p>
              <p><strong>Farmers:</strong> Can list products, manage orders, communicate with customers, and manage their farm profile. Farmer accounts require verification.</p>
            </div>

            <h4 className="font-semibold">Prohibited Activities</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Providing false or misleading information</li>
              <li>Impersonating another person or entity</li>
              <li>Using the platform for illegal activities</li>
              <li>Harassing, threatening, or abusing other users</li>
              <li>Attempting to circumvent platform fees or policies</li>
              <li>Posting inappropriate or offensive content</li>
            </ul>
          </div>
        </Section>

        {/* Products and Orders */}
        <Section icon={Truck} title="3. Products, Orders, and Transactions">
          <div className="space-y-3">
            <h4 className="font-semibold">Product Listings</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Farmers are responsible for accurate product descriptions, pricing, and availability</li>
              <li>All food products must comply with local health and safety regulations</li>
              <li>Products must be accurately categorized and tagged</li>
              <li>Farmers must clearly indicate organic certifications, farming methods, and any allergen information</li>
            </ul>

            <h4 className="font-semibold">Order Process</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Orders are confirmed when farmers accept them</li>
              <li>Customers are responsible for providing accurate delivery information</li>
              <li>Order modifications must be agreed upon by both parties</li>
              <li>Delivery times and methods are determined by individual farmers</li>
            </ul>

            <h4 className="font-semibold">Quality and Freshness</h4>
            <p>
              While we facilitate connections between farmers and customers, the quality, freshness, and safety of products are the sole responsibility of the farmers. We encourage customers to communicate directly with farmers about their quality standards and expectations.
            </p>
          </div>
        </Section>

        {/* Payments and Fees */}
        <Section icon={CreditCard} title="4. Payments, Fees, and Refunds">
          <div className="space-y-3">
            <h4 className="font-semibold">Payment Processing</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All payments are processed securely through our platform</li>
              <li>Customers authorize payment when placing orders</li>
              <li>Farmers receive payment after successful order completion</li>
              <li>We may hold payments in case of disputes</li>
            </ul>

            <h4 className="font-semibold">Platform Fees</h4>
            <p>
              We may charge transaction fees to farmers for completed orders. Current fee structure will be clearly communicated in farmer dashboards and updated terms.
            </p>

            <h4 className="font-semibold">Refunds and Cancellations</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Cancellation policies are set by individual farmers</li>
              <li>Refunds for quality issues should be resolved between customer and farmer</li>
              <li>Platform may mediate disputes when necessary</li>
              <li>Refunds are processed within 5-10 business days when approved</li>
            </ul>
          </div>
        </Section>

        {/* Communication */}
        <Section icon={MessageSquare} title="5. Communication and Messaging">
          <div className="space-y-3">
            <p>
              Our platform includes messaging features to facilitate communication between farmers and customers.
            </p>
            
            <h4 className="font-semibold">Communication Guidelines</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Keep communications relevant to orders and products</li>
              <li>Be respectful and professional in all interactions</li>
              <li>Do not share personal contact information unnecessarily</li>
              <li>Report inappropriate behavior to platform administrators</li>
            </ul>

            <h4 className="font-semibold">Privacy</h4>
            <p>
              While we provide secure messaging, users should not share sensitive personal or financial information through our messaging system.
            </p>
          </div>
        </Section>

        {/* Privacy and Data */}
        <Section icon={Shield} title="6. Privacy and Data Protection">
          <div className="space-y-3">
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
            </p>
            
            <h4 className="font-semibold">Data Collection</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We collect information necessary to provide our services</li>
              <li>Location data is used for delivery coordination and local search</li>
              <li>Communication data helps improve our platform</li>
              <li>Payment information is processed securely by third-party providers</li>
            </ul>

            <h4 className="font-semibold">Data Usage</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your data helps us provide better service matching</li>
              <li>Aggregated data may be used for platform improvements</li>
              <li>We do not sell personal data to third parties</li>
              <li>Marketing communications require explicit opt-in consent</li>
            </ul>
          </div>
        </Section>

        {/* Liability and Disclaimers */}
        <Section icon={Shield} title="7. Liability and Disclaimers">
          <div className="space-y-3">
            <h4 className="font-semibold">Platform Role</h4>
            <p>
              We provide a marketplace platform that connects farmers and customers. We are not responsible for the actual products, services, or transactions that occur between users.
            </p>

            <h4 className="font-semibold">Food Safety</h4>
            <p>
              Farmers are solely responsible for food safety, proper handling, storage, and compliance with health regulations. Customers assume responsibility for proper handling after delivery.
            </p>

            <h4 className="font-semibold">Limitation of Liability</h4>
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm">
                <strong>Important:</strong> Our total liability to you for any claims related to the service will not exceed the amount paid by you to use our platform in the 12 months preceding the claim.
              </p>
            </div>
          </div>
        </Section>

        {/* Termination */}
        <Section icon={Gavel} title="8. Account Termination">
          <div className="space-y-3">
            <h4 className="font-semibold">Termination by Users</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You may close your account at any time</li>
              <li>Outstanding orders must be completed before account closure</li>
              <li>Some data may be retained for legal and business purposes</li>
            </ul>

            <h4 className="font-semibold">Termination by Platform</h4>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or pose risks to other users or the platform.
            </p>
          </div>
        </Section>

        {/* Legal and Miscellaneous */}
        <Section icon={Gavel} title="9. Legal and Miscellaneous">
          <div className="space-y-3">
            <h4 className="font-semibold">Governing Law</h4>
            <p>
              These terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
            </p>

            <h4 className="font-semibold">Dispute Resolution</h4>
            <p>
              Any disputes arising from these terms or use of the service will first be addressed through good faith negotiation. If unresolved, disputes may be subject to binding arbitration.
            </p>

            <h4 className="font-semibold">Severability</h4>
            <p>
              If any provision of these terms is found to be unenforceable, the remaining provisions will continue to be valid and enforceable.
            </p>

            <h4 className="font-semibold">Contact Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>If you have questions about these Terms of Service, please contact us at:</p>
              <ul className="mt-2">
                <li>Email: legal@yourplatform.com</li>
                <li>Address: [Your Business Address]</li>
                <li>Phone: [Your Contact Number]</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <Separator className="my-8" />
        <div className="text-center text-sm text-gray-600">
          <p>
            By using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
          <p className="mt-2">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;