"use client";

import { Quote, QuoteItem } from "@/lib/types/quotes";
import { Client } from "@/lib/types/clients";
import { ApiTripDetails } from "@/lib/types/quoteAssistant";
import { Plane, Hotel, Calendar, MapPin, Users, Check } from "lucide-react";

interface PrintableQuoteProps {
  quote: Quote;
  client: Client;
  tripDetails: ApiTripDetails | null;
  showCommissions?: boolean;
}

export function PrintableQuote({
  quote,
  client,
  tripDetails,
  showCommissions = false,
}: PrintableQuoteProps) {
  const flights = quote.items.filter((item) => item.type === "Flight");
  const hotels = quote.items.filter((item) => item.type === "Hotel");
  const itinerary = quote.items.filter(
    (item) => item.type === "Itinerary" || item.type === "Tour"
  );

  const calculateTotal = () => {
    // Exclude itinerary items from total cost
    return quote.items
      .filter((item) => item.type !== "Itinerary" && item.type !== "Tour")
      .reduce((sum, item) => {
        let total = Number(item.price);
        if (item.type === "Flight") {
           const meta = item.metadata as any;
           if (meta?.return_price !== undefined) {
             total += Number(meta.return_price);
           } else if (meta?.return?.price_per_seat) {
             total += Number(meta.return.price_per_seat);
           }
        }
        return sum + total;
      }, 0);
  };

  // Standard hex colors to avoid Tailwind 4's lab/oklch functions
  const colors = {
    primary: "#2563eb", // blue-600
    primaryLight: "#eff6ff", // blue-50
    primaryBorder: "#dbeafe", // blue-100
    primaryDark: "#1e3a8a", // blue-900
    success: "#22c55e", // green-500
    textMain: "#111827", // gray-900
    textMuted: "#6b7280", // gray-500
    textLight: "#9ca3af", // gray-400
    bgLight: "#f9fafb", // gray-50
    borderLight: "#e5e7eb", // gray-200
  };

  return (
    <div
      id="printable-quote"
      style={{
        backgroundColor: "#ffffff",
        color: colors.textMain,
        width: "210mm",
        margin: "0 auto",
      }}>
      {/* Page 1: Overview, Flights, Accommodations */}
      <div
        className="pdf-page"
        style={{
          padding: "48px",
          backgroundColor: "#ffffff",
          minHeight: "297mm",
        }}>
        {/* Header / Branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: `2px solid ${colors.primary}`,
            paddingBottom: "32px",
            marginBottom: "32px",
          }}>
          <div>
            <h1
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: colors.primary,
                marginBottom: "8px",
              }}>
              TARA
            </h1>
            <p style={{ color: colors.textMuted, fontWeight: "500" }}>
              Travel Agent Resource Assistant
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
              }}>
              Trip Quote
            </h2>
            <p style={{ color: colors.textMuted }}>
              Quote ID: {quote.id || "Draft"}
            </p>
            <p style={{ color: colors.textMuted }}>
              Date: {new Date().toLocaleDateString()}
            </p>
            {/* <p style={{ color: colors.textMuted }}>Version: {quote.version}</p> */}
          </div>
        </div>

        {/* Client & Trip Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "48px",
            marginBottom: "40px",
          }}>
          <div>
            <h3
              style={{
                fontSize: "14px",
                textTransform: "uppercase",
                fontWeight: "bold",
                color: colors.primary,
                letterSpacing: "0.05em",
                marginBottom: "16px",
              }}>
              Prepared For
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <p style={{ fontSize: "20px", fontWeight: "bold" }}>
                {client.name}
              </p>
              <p style={{ color: "#4b5563" }}>{client.email}</p>
              <p style={{ color: "#4b5563" }}>{client.phone}</p>
            </div>
          </div>
          <div>
            <h3
              style={{
                fontSize: "14px",
                textTransform: "uppercase",
                fontWeight: "bold",
                color: colors.primary,
                letterSpacing: "0.05em",
                marginBottom: "16px",
              }}>
              Trip Overview
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#374151",
                }}>
                <MapPin size={16} color={colors.primary} />
                <span style={{ fontWeight: "600" }}>
                  {tripDetails?.destination || quote.destination}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#374151",
                }}>
                <Calendar size={16} color={colors.primary} />
                <span>
                  {tripDetails?.departure_date} — {tripDetails?.return_date}
                </span>
              </div>
              {/* <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#374151",
                }}>
                <Users size={16} color={colors.primary} />
                <span>{tripDetails?.adults || 2} Travelers</span>
              </div> */}
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div
          style={{
            marginBottom: "40px",
            backgroundColor: colors.primaryLight,
            padding: "24px",
            borderRadius: "12px",
            border: `1px solid ${colors.primaryBorder}`,
          }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: colors.primaryDark,
              marginBottom: "16px",
            }}>
            What's Included
          </h3>
          <ul
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 32px",
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}>
            {flights.length > 0 && (
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: colors.primaryDark,
                }}>
                <Check size={16} color={colors.success} />
                Round-trip flights
              </li>
            )}
            {hotels.length > 0 && (
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: colors.primaryDark,
                }}>
                <Check size={16} color={colors.success} />
                Premium accommodations
              </li>
            )}
            {itinerary.length > 0 && (
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: colors.primaryDark,
                }}>
                <Check size={16} color={colors.success} />
                Curated daily activities
              </li>
            )}
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: colors.primaryDark,
              }}>
              <Check size={16} color={colors.success} />
              24/7 Travel support
            </li>
          </ul>
        </div>

        {/* Itemized Sections: Flights & Hotels */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {/* Flights */}
          {flights.length > 0 && (
            <section>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  borderBottom: `1px solid ${colors.borderLight}`,
                  paddingBottom: "8px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                <Plane size={20} color={colors.primary} /> Flights
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}>
                {flights.map((flight, idx) => {
                  const meta = flight.metadata as any;
                  const hasReturn = !!meta?.return;
                  const outboundPrice = Number(flight.price);
                  const returnPrice = meta?.return_price !== undefined 
                    ? Number(meta.return_price) 
                    : Number(meta?.return?.price_per_seat || 0);

                  return (
                    <div
                      key={idx}
                      style={{
                         display: "flex",
                         flexDirection: "column",
                         gap: "12px",
                         padding: "16px",
                         backgroundColor: colors.bgLight,
                         borderRadius: "8px",
                      }}>
                       {/* Outbound */}
                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p style={{ fontWeight: "bold", fontSize: "18px", margin: 0 }}>
                              {hasReturn ? `${flight.title} (Outbound)` : flight.title}
                            </p>
                            <p style={{ color: "#4b5563", margin: 0 }}>
                                {hasReturn && meta?.outbound ? (
                                    `${meta.outbound.departure?.split("T")[1]?.substring(0,5)} - ${meta.outbound.arrival?.split("T")[1]?.substring(0,5)}`
                                ) : flight.description}
                            </p>
                          </div>
                          <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
                            ${outboundPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                       </div>

                       {/* Return */}
                       {hasReturn && (
                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px dashed ${colors.borderLight}`, paddingTop: "12px" }}>
                              <div>
                                <p style={{ fontWeight: "bold", fontSize: "18px", margin: 0 }}>
                                  {meta?.carrier || flight.title} (Return)
                                </p>
                                <p style={{ color: "#4b5563", margin: 0 }}>
                                    {meta?.return ? (
                                        `${meta.return.departure?.split("T")[1]?.substring(0,5)} - ${meta.return.arrival?.split("T")[1]?.substring(0,5)}`
                                    ) : "Return Flight"}
                                </p>
                              </div>
                              <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
                                ${returnPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                           </div>
                       )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Hotels */}
          {hotels.length > 0 && (
            <section>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  borderBottom: `1px solid ${colors.borderLight}`,
                  paddingBottom: "8px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                <Hotel size={20} color={colors.primary} /> Accommodations
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}>
                {hotels.map((hotel, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                      backgroundColor: colors.bgLight,
                      borderRadius: "8px",
                    }}>
                    <div>
                      <p
                        style={{
                          fontWeight: "bold",
                          fontSize: "18px",
                          margin: 0,
                        }}>
                        {hotel.title}
                      </p>
                      <p style={{ color: "#4b5563", margin: 0 }}>
                        {hotel.description}
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        margin: 0,
                      }}>
                      ${Number(hotel.price).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Page 2: Daily Itinerary */}
      {itinerary.length > 0 && (
        <div
          className="pdf-page"
          style={{
            padding: "48px",
            backgroundColor: "#ffffff",
            minHeight: "297mm",
          }}>
          <section>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                borderBottom: `2px solid ${colors.primary}`,
                paddingBottom: "12px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: colors.primary,
              }}>
              <Calendar size={24} color={colors.primary} /> Daily Itinerary
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {Object.entries(
                itinerary.reduce((groups, item) => {
                  const day = item.day || "Unscheduled";
                  if (!groups[day]) groups[day] = [];
                  groups[day].push(item);
                  return groups;
                }, {} as Record<string, QuoteItem[]>)
              )
                .sort((a, b) => {
                  const dayA =
                    parseInt(a[0].toString().replace(/\D/g, "")) || 999;
                  const dayB =
                    parseInt(b[0].toString().replace(/\D/g, "")) || 999;
                  return dayA - dayB;
                })
                .map(([day, items]) => (
                  <div
                    key={day}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}>
                    <h4
                      style={{
                        fontWeight: "bold",
                        fontSize: "18px",
                        color: colors.primary,
                        borderLeft: `4px solid ${colors.primary}`,
                        paddingLeft: "12px",
                        margin: 0,
                      }}>
                      Day {day}
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        paddingLeft: "16px",
                      }}>
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            paddingBottom: "12px",
                            borderBottom: `1px solid ${colors.bgLight}`,
                          }}>
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                fontWeight: "600",
                                fontSize: "16px",
                                margin: 0,
                              }}>
                              {item.title}
                            </p>
                            <p
                              style={{
                                fontSize: "14px",
                                color: "#4b5563",
                                margin: 0,
                                marginTop: "4px",
                              }}>
                              {item.description}
                            </p>
                          </div>
                          {/* {Number(item.price) > 0 && (
                          <p style={{ fontWeight: 'bold', marginLeft: '16px', margin: 0 }}>${Number(item.price).toLocaleString()}</p>
                        )} */}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      )}

      {/* Page 3: Total Summary & Footer */}
      <div
        className="pdf-page"
        style={{
          padding: "48px",
          backgroundColor: "#ffffff",
          minHeight: "297mm",
          display: "flex",
          flexDirection: "column",
        }}>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              borderBottom: `2px solid ${colors.primary}`,
              paddingBottom: "12px",
              marginBottom: "32px",
              color: colors.primary,
            }}>
            Price Summary
          </h3>

          <div
            style={{
              backgroundColor: colors.bgLight,
              padding: "32px",
              borderRadius: "16px",
              border: `1px solid ${colors.borderLight}`,
            }}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#4b5563",
                  fontSize: "18px",
                }}>
                <span>Flights Total</span>
                <span style={{ fontWeight: "600", color: colors.textMain }}>
                  ${flights.reduce((sum, f) => {
                      let t = Number(f.price);
                      const meta = f.metadata as any;
                      if(meta?.return_price !== undefined) {
                        t += Number(meta.return_price);
                      } else if (meta?.return?.price_per_seat) {
                        t += Number(meta.return.price_per_seat);
                      }
                      return sum + t;
                  }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#4b5563",
                  fontSize: "18px",
                }}>
                <span>Accommodations Total</span>
                <span style={{ fontWeight: "600", color: colors.textMain }}>
                  ${hotels.reduce((sum, h) => sum + Number(h.price), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              {showCommissions && quote.priceSummary && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#4b5563",
                      fontSize: "18px",
                    }}>
                    <span>Agent Commission ({quote.priceSummary.agentCommissionPercent}%)</span>
                    <span style={{ fontWeight: "600", color: colors.textMain }}>
                      ${quote.priceSummary.agentCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#4b5563",
                      fontSize: "18px",
                    }}>
                    <span>Agency Commission ({quote.priceSummary.agencyCommissionPercent}%)</span>
                    <span style={{ fontWeight: "600", color: colors.textMain }}>
                      ${quote.priceSummary.agencyCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              {/* <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#4b5563",
                  fontSize: "18px",
                }}>
                <span>Taxes & Fees</span>
                <span style={{ fontWeight: "600", color: colors.textMain }}>
                  Included
                </span>
              </div> */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "24px",
                  paddingTop: "24px",
                  borderTop: `2px solid ${colors.borderLight}`,
                }}>
                <span style={{ fontSize: "24px", fontWeight: "bold" }}>
                  Total Amount
                </span>
                <span
                  style={{
                    fontSize: "42px",
                    fontWeight: "bold",
                    color: colors.primary,
                  }}>
                  ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "48px",
              padding: "24px",
              border: `1px dashed ${colors.textLight}`,
              borderRadius: "12px",
            }}>
            <h4 style={{ fontWeight: "bold", marginBottom: "12px" }}>
              Terms & Conditions
            </h4>
            <ul
              style={{
                fontSize: "14px",
                color: colors.textMuted,
                paddingLeft: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}>
              <li>Price is subject to availability at the time of booking.</li>
              <li>
                Cancellation policies vary by supplier and will be provided upon
                confirmation.
              </li>
              <li>
                Travel insurance is highly recommended for all international
                trips.
              </li>
              <li>
                Valid passport and necessary visas are the responsibility of the
                traveler.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "80px",
            textAlign: "center",
            color: colors.textLight,
            fontSize: "12px",
            borderTop: `1px solid ${colors.borderLight}`,
            paddingTop: "24px",
          }}>
          <p
            style={{
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "4px",
            }}>
            Thank you for choosing TARA for your travel needs!
          </p>
          <p>This quote is valid for 7 days from the date of issue.</p>
          <p style={{ marginTop: "4px" }}>
            © {new Date().getFullYear()} TARA Travel Group. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
