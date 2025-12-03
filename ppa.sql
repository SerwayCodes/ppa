--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
-- Dumped by pg_dump version 16.3

-- Started on 2025-11-30 13:22:29

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16384)
-- Name: adminpack; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS adminpack WITH SCHEMA pg_catalog;


--
-- TOC entry 4848 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION adminpack; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION adminpack IS 'administrative functions for PostgreSQL';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16397)
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    admin_id character varying(15) NOT NULL,
    user_id character varying(15),
    first_name character varying(50),
    last_name character varying(50),
    phone_number character varying(15)
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16400)
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_events (
    id integer NOT NULL,
    start_date date,
    end_date date,
    event_name text
);


ALTER TABLE public.calendar_events OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16405)
-- Name: calendar_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calendar_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendar_events_id_seq OWNER TO postgres;

--
-- TOC entry 4849 (class 0 OID 0)
-- Dependencies: 218
-- Name: calendar_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calendar_events_id_seq OWNED BY public.calendar_events.id;


--
-- TOC entry 222 (class 1259 OID 16426)
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    form_level character varying(5) NOT NULL,
    class_name character varying(100)
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16438)
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    student_id character varying(15) NOT NULL,
    user_id character varying(15),
    first_name character varying(50),
    last_name character varying(50),
    phone_number character varying(20),
    date_of_birth date,
    gender character varying(10),
    district character varying(50),
    tradi_auth character varying(50),
    village character varying(50),
    next_of_kin_name character varying(100),
    next_of_kin_relationship character varying(20),
    next_of_kin_phone_number character varying(20),
    next_of_kin_email character varying(100),
    registration_start_date date,
    registration_end_date date,
    registration_status boolean DEFAULT false,
    next_of_kin_address character varying(300),
    nationality character varying(50),
    contact_address character varying(300),
    fees_balance numeric DEFAULT 0,
    is_current boolean DEFAULT true,
    exam_results_status boolean DEFAULT false,
    form_level bigint
);


ALTER TABLE public.students OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16406)
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    subject_id character varying(10) NOT NULL,
    subject_name character varying(100),
    department character varying(15),
    form_level bigint
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16418)
-- Name: teacher_subject; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_subject (
    teacher_id character varying(15) NOT NULL,
    subject_id character varying(10) NOT NULL
);


ALTER TABLE public.teacher_subject OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16421)
-- Name: teachers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teachers (
    lecturer_id character varying(15) NOT NULL,
    user_id character varying(15),
    first_name character varying(50),
    last_name character varying(50),
    phone_number character varying(20),
    date_of_birth date,
    nationality character varying(100),
    district character varying(50),
    address text,
    tradi_auth character varying(50),
    village character varying(50),
    gender character varying(10)
);


ALTER TABLE public.teachers OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16447)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id character varying(15) NOT NULL,
    password character varying(255),
    email character varying(100),
    user_role character varying(20),
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4663 (class 2604 OID 16450)
-- Name: calendar_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events ALTER COLUMN id SET DEFAULT nextval('public.calendar_events_id_seq'::regclass);


--
-- TOC entry 4834 (class 0 OID 16397)
-- Dependencies: 216
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (admin_id, user_id, first_name, last_name, phone_number) FROM stdin;
RXY1813	RXY1813	Synet	Maonekedwe	\N
\.


--
-- TOC entry 4835 (class 0 OID 16400)
-- Dependencies: 217
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calendar_events (id, start_date, end_date, event_name) FROM stdin;
3	2023-10-12	2023-11-10	Student Registration
4	2023-11-23	2023-11-29	Mid Semester Exams
5	2023-11-29	2023-12-08	Mid Semester Break
6	2024-01-23	2024-02-10	End Of year Exams
\.


--
-- TOC entry 4840 (class 0 OID 16426)
-- Dependencies: 222
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (form_level, class_name) FROM stdin;
1	Form 1
2	Form 2
3	Form 3
4	Form 4
\.


--
-- TOC entry 4841 (class 0 OID 16438)
-- Dependencies: 223
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (student_id, user_id, first_name, last_name, phone_number, date_of_birth, gender, district, tradi_auth, village, next_of_kin_name, next_of_kin_relationship, next_of_kin_phone_number, next_of_kin_email, registration_start_date, registration_end_date, registration_status, next_of_kin_address, nationality, contact_address, fees_balance, is_current, exam_results_status, form_level) FROM stdin;
PPA/SD/F3/001	PPA/SD/F3/001	Synet	Maonekedwe	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	0	t	f	1
rs1234	rs1234	sy	malooks	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	0	t	f	1
\.


--
-- TOC entry 4837 (class 0 OID 16406)
-- Dependencies: 219
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subjects (subject_id, subject_name, department, form_level) FROM stdin;
AGRI1	AGRICULTURE	SCIENCE	1
AGRI2	AGRICULTURE	SCIENCE	2
AGRI3	AGRICULTURE	SCIENCE	3
AGRI4	AGRICULTURE	SCIENCE	4
BIO1	BIOLOGY	SCIENCE	1
BIO2	BIOLOGY	SCIENCE	2
BIO3	BIOLOGY	SCIENCE	3
BIO4	BIOLOGY	SCIENCE	4
CHEM1	CHEMISTRY	SCIENCE	1
CHEM2	CHEMISTRY	SCIENCE	2
CHEM3	CHEMISTRY	SCIENCE	3
CHEM4	CHEMISTRY	SCIENCE	4
PHY1	PHYSICS	SCIENCE	1
PHY2	PHYSICS	SCIENCE	2
PHY3	PHYSICS	SCIENCE	3
PHY4	PHYSICS	SCIENCE	4
MATH1	MATHEMATICS	SCIENCE	1
MATH2	MATHEMATICS	SCIENCE	2
MATH3	MATHEMATICS	SCIENCE	3
MATH4	MATHEMATICS	SCIENCE	4
COMP1	COMPUTER_STUDIES	SCIENCE	1
COMP2	COMPUTER_STUDIES	SCIENCE	2
COMP3	COMPUTER_STUDIES	SCIENCE	3
COMP4	COMPUTER_STUDIES	SCIENCE	4
ENG1	ENGLISH	LANGAUGES	1
ENG2	ENGLISH	LANGAUGES	2
ENG3	ENGLISH	LANGAUGES	3
ENG4	ENGLISH	LANGAUGES	4
CHICH1	CHICHEWA	LANGAUGES	1
CHICH2	CHICHEWA	LANGAUGES	2
CHICH3	CHICHEWA	LANGAUGES	3
CHICH4	CHICHEWA	LANGAUGES	4
FRN1	FRENCH	LANGAUGES	1
FRN2	FRENCH	LANGAUGES	2
FRN3	FRENCH	LANGAUGES	3
FRN4	FRENCH	LANGAUGES	4
HIST1	HISTORY	HUMANITIES	1
HIST2	HISTORY	HUMANITIES	2
HIST3	HISTORY	HUMANITIES	3
HIST4	HISTORY	HUMANITIES	4
GEO1	GEOGRAPHY	HUMANITIES	1
GEO2	GEOGRAPHY	HUMANITIES	2
GEO3	GEOGRAPHY	HUMANITIES	3
GEO4	GEOGRAPHY	HUMANITIES	4
SOC1	SOCIAL_STUDIES	HUMANITIES	1
SOC2	SOCIAL_STUDIES	HUMANITIES	2
SOC3	SOCIAL_STUDIES	HUMANITIES	3
SOC4	SOCIAL_STUDIES	HUMANITIES	4
LIFE1	LIFE_SKILLS	HUMANITIES	1
LIFE2	LIFE_SKILLS	HUMANITIES	2
LIFE3	LIFE_SKILLS	HUMANITIES	3
LIFE4	LIFE_SKILLS	HUMANITIES	4
\.


--
-- TOC entry 4838 (class 0 OID 16418)
-- Dependencies: 220
-- Data for Name: teacher_subject; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_subject (teacher_id, subject_id) FROM stdin;
\.


--
-- TOC entry 4839 (class 0 OID 16421)
-- Dependencies: 221
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teachers (lecturer_id, user_id, first_name, last_name, phone_number, date_of_birth, nationality, district, address, tradi_auth, village, gender) FROM stdin;
\.


--
-- TOC entry 4842 (class 0 OID 16447)
-- Dependencies: 224
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, password, email, user_role, last_login) FROM stdin;
PPA/SD/F3/001	$2b$10$35g0gGOoMAvH.PN9uQX5nORTK5qeyi19pVn..Gra2I/bmoC1IOawW	sma@gmail.com	Student	\N
rs1234	$2b$10$RckTmuuIsFLmH3SW8Fydouo9Sqjr0mmZEGgLw3Z5UCbOOFd0791kK	sa@gmail.com	Student	\N
RXY1813	$2b$10$Mw2hUkP2xjquzOfvKJgptudonwJQw.6pzMbdE3f9p4LtJHBO/OcoG	admin1@example.com	Admin	2025-11-30 13:08:10.398022
\.


--
-- TOC entry 4850 (class 0 OID 0)
-- Dependencies: 218
-- Name: calendar_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calendar_events_id_seq', 6, true);


--
-- TOC entry 4669 (class 2606 OID 16453)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (admin_id);


--
-- TOC entry 4671 (class 2606 OID 16455)
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4675 (class 2606 OID 16465)
-- Name: teacher_subject lecturer_course_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subject
    ADD CONSTRAINT lecturer_course_pkey PRIMARY KEY (teacher_id, subject_id);


--
-- TOC entry 4677 (class 2606 OID 16467)
-- Name: teachers lecturers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT lecturers_pkey PRIMARY KEY (lecturer_id);


--
-- TOC entry 4679 (class 2606 OID 16469)
-- Name: classes programs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT programs_pkey PRIMARY KEY (form_level);


--
-- TOC entry 4681 (class 2606 OID 16475)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (student_id);


--
-- TOC entry 4673 (class 2606 OID 16457)
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (subject_id);


--
-- TOC entry 4683 (class 2606 OID 16477)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4685 (class 2606 OID 16479)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4686 (class 2606 OID 16480)
-- Name: admins admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4687 (class 2606 OID 16510)
-- Name: teacher_subject lecturer_course_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subject
    ADD CONSTRAINT lecturer_course_course_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id);


--
-- TOC entry 4688 (class 2606 OID 16515)
-- Name: teacher_subject lecturer_course_lecturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subject
    ADD CONSTRAINT lecturer_course_lecturer_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(lecturer_id);


--
-- TOC entry 4689 (class 2606 OID 16520)
-- Name: teachers lecturers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT lecturers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4690 (class 2606 OID 16545)
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;



