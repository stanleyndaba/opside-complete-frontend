import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Code, Zap, Shield, Globe, ArrowRight } from 'lucide-react';

const ApiAccess = () => {
  return (
    <div className="min-h-screen bg-[#0B1426] text-white">
      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        
        {/* Headline Section */}
        <div className="text-center mb-16">
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-gray-100 mb-6 leading-tight">
            The Clario API
          </h1>
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-gray-300 mb-8">
            The Financial Engine for Modern Commerce
          </h2>
          <p className="font-body text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            At Clario, we are building more than a dashboard. We are building the intelligent financial recovery layer for e-commerce. Our future-facing API will allow developers, agencies, and enterprise brands to programmatically access the full power of our platform, integrating automated reimbursement data and workflows directly into their own systems.
          </p>
        </div>

        {/* Code Snippet Visual Anchor */}
        <div className="mb-16">
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-4 text-gray-400 text-sm font-mono">Python</span>
                </div>
                <div className="font-mono text-sm space-y-2">
                  <div className="text-gray-400">
                    <span className="text-green-400">#</span> Get the latest recovered claims
                  </div>
                  <div className="text-blue-400">
                    clario = <span className="text-yellow-400">Clario</span>(api_key=<span className="text-green-400">"YOUR_API_KEY"</span>)
                  </div>
                  <div></div>
                  <div className="text-blue-400">
                    recovered_claims = clario.claims.<span className="text-yellow-400">list</span>(
                  </div>
                  <div className="ml-4 text-gray-300">
                    status=<span className="text-green-400">"recovered"</span>,
                  </div>
                  <div className="ml-4 text-gray-300">
                    limit=<span className="text-yellow-400">10</span>
                  </div>
                  <div className="text-blue-400">)</div>
                  <div></div>
                  <div className="text-blue-400">
                    <span className="text-purple-400">for</span> claim <span className="text-purple-400">in</span> recovered_claims:
                  </div>
                  <div className="ml-4 text-gray-300">
                    <span className="text-yellow-400">print</span>(<span className="text-green-400">f"Recovered {claim.amount} for claim ID: {claim.id}"</span>)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Sections */}
        <div className="space-y-16">
          
          {/* What You Will Be Able to Do */}
          <div>
            <h3 className="font-heading text-3xl font-bold text-gray-100 mb-8">
              What You Will Be Able to Do
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gray-900/30 border-gray-700/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <Globe className="h-5 w-5 text-blue-400" />
                    </div>
                    <h4 className="font-heading text-xl font-semibold text-gray-100">
                      Sync Recovery Data
                    </h4>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    Pull all detected claims, their statuses, and their financial value directly into your own internal dashboards, data warehouses, or ERP systems.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/30 border-gray-700/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                      <Code className="h-5 w-5 text-green-400" />
                    </div>
                    <h4 className="font-heading text-xl font-semibold text-gray-100">
                      Build Custom Reporting
                    </h4>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    Create bespoke financial reports and analytics for your team or your clients, leveraging real-time data from the Clario engine.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/30 border-gray-700/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-purple-400" />
                    </div>
                    <h4 className="font-heading text-xl font-semibold text-gray-100">
                      Automate Workflows
                    </h4>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    Programmatically approve claims, trigger scans, and manage your recovery pipeline without ever needing to log into the Clario UI.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How It Will Work */}
          <div>
            <h3 className="font-heading text-3xl font-bold text-gray-100 mb-8">
              How It Will Work
            </h3>
            <div className="space-y-6">
              <Card className="bg-gray-900/30 border-gray-700/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Code className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-heading text-xl font-semibold text-gray-100 mb-2">
                        Modern REST Architecture
                      </h4>
                      <p className="text-gray-400 leading-relaxed">
                        A clean, predictable, and well-documented REST API that is easy to integrate with.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/30 border-gray-700/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-heading text-xl font-semibold text-gray-100 mb-2">
                        Real-Time Webhooks
                      </h4>
                      <p className="text-gray-400 leading-relaxed">
                        Receive real-time push notifications to your own services for key events like claim.detected, claim.submitted, and funds.recovered.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/30 border-gray-700/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-heading text-xl font-semibold text-gray-100 mb-2">
                        Secure and Scalable
                      </h4>
                      <p className="text-gray-400 leading-relaxed">
                        Built with the same enterprise-grade security and reliability as our core platform, ensuring your data is always safe and accessible.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Get Notified Section */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardContent className="p-12">
                <h3 className="font-heading text-3xl font-bold text-gray-100 mb-4">
                  Get Notified
                </h3>
                <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                  Our developer API is currently in a private beta with select partners. If you are an enterprise brand, an agency, or a developer interested in building on the Clario platform, please contact us to be added to the early access list.
                </p>
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Request Early Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ApiAccess;