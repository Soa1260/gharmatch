/**
 * The emergency and support directory. Every entry names its source and says what we actually did with it.
 * We never present a number as verified unless we read it on an official page, and we say when that page is old.
 * None of these services is run by Gharmatch.
 */
export type Verification = "CHECKED" | "CHECKED_OLD_SOURCE" | "NOT_YET_CHECKED";

export interface DirectoryEntry {
  name: string;
  number?: string;
  what: string;
  operator: string;
  source?: { label: string; url: string; pageDate?: string };
  /** The date we read the source, ISO. Absent when we have not checked. */
  checkedOn?: string;
  status: Verification;
  caution?: string;
}

const CHECKED_ON = "2026-11-08";

export const DIRECTORY: DirectoryEntry[] = [
  {
    name: "Women Helpline, Gujarat (Abhayam)",
    number: "181",
    what: "Toll-free helpline for women who need information, guidance or help. Works from any district.",
    operator: "Women and Child Development Department, Government of Gujarat",
    source: { label: "wcd.gujarat.gov.in, Abhayam 181 page (published 31 Jan 2023)", url: "https://wcd.gujarat.gov.in/initiativedetails?id=280", pageDate: "Site footer showed 07-11-2026" },
    checkedOn: CHECKED_ON,
    status: "CHECKED",
  },
  {
    name: "Child Helpline",
    number: "1098",
    what: "Helpline for children in need of care and protection.",
    operator: "Ahmedabad district administration listing",
    source: { label: "ahmedabad.nic.in, Emergencies Help Line", url: "https://ahmedabad.nic.in/helpline/", pageDate: "Page says last updated 30.03.2020" },
    checkedOn: CHECKED_ON,
    status: "CHECKED_OLD_SOURCE",
    caution: "The official page we read was last updated in 2020. Call to confirm it works.",
  },
  {
    name: "Ambulance",
    number: "108",
    what: "Ambulance helpline. The same district page also lists 102.",
    operator: "Ahmedabad district administration listing",
    source: { label: "ahmedabad.nic.in, Emergencies Help Line", url: "https://ahmedabad.nic.in/helpline/", pageDate: "Page says last updated 30.03.2020" },
    checkedOn: CHECKED_ON,
    status: "CHECKED_OLD_SOURCE",
    caution: "The official page we read was last updated in 2020. Call to confirm it works.",
  },
  {
    name: "Crime Stopper",
    number: "1090",
    what: "Listed as the Crime Stopper helpline on the Ahmedabad district page.",
    operator: "Ahmedabad district administration listing",
    source: { label: "ahmedabad.nic.in, Emergencies Help Line", url: "https://ahmedabad.nic.in/helpline/", pageDate: "Page says last updated 30.03.2020" },
    checkedOn: CHECKED_ON,
    status: "CHECKED_OLD_SOURCE",
    caution: "The official page we read was last updated in 2020. Call to confirm it works.",
  },
  {
    name: "National emergency number",
    number: "112",
    what: "Single emergency number for police, fire and ambulance across India.",
    operator: "Government of India (112 India)",
    source: { label: "112.gov.in", url: "https://112.gov.in/" },
    status: "NOT_YET_CHECKED",
    caution: "Widely published, but its official site did not load when we tried. We have not confirmed it ourselves.",
  },
  {
    name: "Women police helpline",
    number: "1091",
    what: "Police helpline for women in distress.",
    operator: "Police",
    status: "NOT_YET_CHECKED",
    caution: "Not found on the official pages we read. Local availability needs checking before launch.",
  },
  {
    name: "Cyber financial fraud",
    number: "1930",
    what: "Report online payment fraud as early as you can.",
    operator: "Government of India",
    status: "NOT_YET_CHECKED",
    caution: "Not found on the official pages we read. We have not confirmed it ourselves.",
  },
  {
    name: "Sankat Sakhi app",
    what: "Government of Gujarat app that gives information on women's support schemes and can call 181 directly. Works offline, according to the department.",
    operator: "Women and Child Development Department, Government of Gujarat",
    source: { label: "wcd.gujarat.gov.in, Sankat Sakhi page (published 1 Aug 2022)", url: "https://wcd.gujarat.gov.in/initiativedetails?id=267" },
    checkedOn: CHECKED_ON,
    status: "CHECKED",
    caution: "We did not find an official download link. Search for it by name in your phone's app store and check the publisher.",
  },
  {
    name: "Sakhi One Stop Centres (Ahmedabad and Gandhinagar)",
    what: "Government centres that support women affected by violence.",
    operator: "Women and Child Development Department, Government of Gujarat",
    source: { label: "wcd.gujarat.gov.in, Sakhi One Stop Centre page", url: "https://wcd.gujarat.gov.in/initiativedetails?id=268" },
    checkedOn: CHECKED_ON,
    status: "NOT_YET_CHECKED",
    caution: "The department page says the scheme exists but gave no addresses or phone numbers for Ahmedabad or Gandhinagar. Ask 181 for the centre nearest you.",
  },
  {
    name: "Women and Child Development office, Gandhinagar",
    what: "The department's head office. This is an office, not an emergency line.",
    operator: "Government of Gujarat",
    source: { label: "wcd.gujarat.gov.in", url: "https://wcd.gujarat.gov.in/", pageDate: "Site footer showed 07-11-2026" },
    checkedOn: CHECKED_ON,
    status: "CHECKED",
    caution: "Block No. 9, 8th Floor, New Sachivalaya, Gandhinagar. Office phone shown on the site: 079-232-57942.",
  },
];

export const STATUS_TEXT: Record<Verification, string> = {
  CHECKED: "Checked against an official page",
  CHECKED_OLD_SOURCE: "Found on an official page that is out of date",
  NOT_YET_CHECKED: "Not yet checked by us",
};
