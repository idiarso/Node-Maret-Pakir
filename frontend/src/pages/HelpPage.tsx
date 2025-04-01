import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Button,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Book as BookIcon,
  VideoLibrary as VideoIcon,
  Help as HelpIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import Breadcrumbs from '../components/Breadcrumbs';

interface FAQItem {
  question: string;
  answer: string;
}

const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | false>(false);

  const faqs: FAQItem[] = [
    {
      question: 'How do I create a new parking ticket?',
      answer: 'To create a new parking ticket, go to the Parking page and click the "New Ticket" button. Enter the vehicle details and click "Create".',
    },
    {
      question: 'How do I process a payment?',
      answer: 'Navigate to the Payments page, select the ticket, and click "Process Payment". Enter the payment details and confirm the transaction.',
    },
    {
      question: 'How do I generate reports?',
      answer: 'Go to the Reports page, select the type of report you want to generate, set the date range, and click "Generate Report".',
    },
    {
      question: 'How do I manage user permissions?',
      answer: 'Go to the Users page, select a user, and click "Edit". You can modify their role and permissions in the edit dialog.',
    },
  ];

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleAccordionChange = (section: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedSection(isExpanded ? section : false);
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Help & Support' },
        ]}
      />
      <PageHeader
        title="Help & Support"
        subtitle="Find answers to common questions and get support"
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Typography variant="h6" gutterBottom>
                Frequently Asked Questions
              </Typography>
              {filteredFaqs.map((faq, index) => (
                <Accordion
                  key={index}
                  expanded={expandedSection === `faq-${index}`}
                  onChange={handleAccordionChange(`faq-${index}`)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>{faq.answer}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <List>
                <ListItem button>
                  <ListItemIcon>
                    <BookIcon />
                  </ListItemIcon>
                  <ListItemText primary="User Manual" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <VideoIcon />
                  </ListItemIcon>
                  <ListItemText primary="Video Tutorials" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <HelpIcon />
                  </ListItemIcon>
                  <ListItemText primary="Knowledge Base" />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Contact Support
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary="support@parkingsystem.com"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone"
                    secondary="+1 (555) 123-4567"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ChatIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Live Chat"
                    secondary="Available 24/7"
                  />
                </ListItem>
              </List>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HelpPage; 